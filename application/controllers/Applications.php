<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

class Applications extends Tele_Controller
{

    function __construct()
    {

        parent::__construct();
        $this->load->model('M_Applications');
        $this->load->model('M_Actions');

    }

    public function get_subdomain_autocomplete()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $text = $this->input->post('text', true);
        $offset = $this->input->post('offset', true);

        $results = $this->M_Applications->get_subdomain_autocomplete($text, $offset);

        $items = [];
        foreach ($results as $result) {
            $items []['key'] = $result['_source']['host'];
        }
        xss_return_success($items);

    }


    //not_used
    public function get_index()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        xss_return_success($this->M_Applications->get_index());
    }

    public function get_expand()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $search = $this->input->post('search');
        $actions = $this->input->post('actions');
        $learning_so_far = $this->input->post('learning_so_far');
        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'asc' : 'desc';
        $size = $this->input->post('size');
        $offset = intval($this->input->post('offset')) > 0 ? intval($this->input->post('offset')) : 0;

        if (!$sort || !in_array($sort, array('host', 'learning_so_far'))) {
            $sort = 'host';
            $dir = 'asc';
        }


//        $res = $this->redisObj->get('cache_applications');

//        if (isset($res) && $res) {
//            $data = json_decode($res);
//            if ($data && !empty($data)) {
//                xss_return_success($data);
//            }
//        }

        // retrieve the apps
        $results = $this->M_Applications->index($search, $learning_so_far, $sort, $dir, $size, $offset);
        $data=$results['data'];

        // search in business actions
        if ($search && $actions){
           $actions = $this->M_Actions->search_actions($search, $size, $offset, $dir );
            $results['finished'] = $actions['finished'];
            foreach($actions['data'] as $action){
                //TODO: add option to add an action to a subdomain
               //$root_domain= $this->M_Applications->get_root_domain($action['application']);
                // if the domain already exists, we add the action to this domain
                if($key=array_search($action['application'],array_column($data,'host'))){
                    $data[$key]['actions'][]=$action;
                }
//                elseif($key=array_search($root_domain,array_column($data,'subdomains'))){
//                    $data[$key]['subdomains']['actions'][]=$action['action_name'];
//                    $data[$key]['subdomains']['host']=$action['application'];
//                }
                else{
                    $data[]=['host'=>$action['application'], 'actions'=>[$action]];
                }

            }
        }

//        $this->redisObj->set('cache_applications', json_encode($data), 600);
        // return the data and a boolean to indicate if all the data is loaded
        xss_return_success(['data'=>$data,'finished'=>$results['finished']]);

    }

    public function get_search()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $search = $this->input->post('search');
        $mode = $this->input->post('mode');

        xss_return_success($this->M_Applications->get_search($search,$mode));

    }

    public function get_page()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $host = htmlspecialchars_decode($this->input->post('host'), ENT_QUOTES);
        $path = $this->input->post('path');
        $mode = $this->input->post('mode');

        xss_return_success($this->M_Applications->get_page($host, $path, $mode));

    }

    public function get_deep_items(){
        telepath_auth(__CLASS__, __FUNCTION__);

        $host = htmlspecialchars_decode($this->input->post('host'), ENT_QUOTES);
        $mode = $this->input->post('mode');

        xss_return_success($this->M_Applications->get_deep_items($host, $mode));
    }

    public function get_app()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $host = $this->input->post('host');

        $app = $this->M_Applications->get(htmlspecialchars_decode($host, ENT_QUOTES));

        if (isset($app['app_ssl_certificate'])) {
            unset($app['app_ssl_certificate']);
        }
        if (isset($app['app_ssl_private'])) {
            unset($app['app_ssl_private']);
        }

        if (!$app) $app = array();



//        if ($context == 'actions') {
//
//            $this->load->model('M_Actions');
//            $actions = $this->M_Actions->get_actions($host);
//            $app['actions'] = $actions;
//
//            if (!isset($app['action_categories'])) {
//                $app['action_categories'] = array();
//            }
//
//        }

        xss_return_success($app);

    }



    // Updates Application
    public function set_app()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $data = $this->input->post();
        $data['host'] = str_replace(array('http://', 'https://'), array('', ''), $data['host']);
        if (empty($data['subdomains'])) {
            $data['subdomains'] = [];
        }

        // store the old data to check for a change
        $old_data = $this->M_Applications->get($data['host']);

        if ($data['operation_mode'] == 3 && ($old_data['operation_mode'] == '' || $old_data['operation_mode'] == 1)) {

            $data['operation_mode'] = 2;
            $this->M_Applications->set($data);

            sleep(1);
            $this->M_Applications->set_operation_mode([['host' => $data['host'], 'operation_mode' => 2]], 3);

        } else {
            $this->M_Applications->set($data);
        }

        $data = $this->M_Applications->get($data['host']);

        $this->load->model('M_Config');
        $this->M_Config->update('app_list_was_changed_id', [$data['host']]);

        // if there was a change in the SSL configuration, we need to update the certificates and update our nginx.conf
        if ($old_data['ssl_flag'] != $data['ssl_flag'] || $old_data['app_ssl_certificate'] != $data['app_ssl_certificate']
            || $old_data['app_ssl_private'] != $data['app_ssl_private'] || $old_data['ssl_server_port'] !=
            $data['ssl_server_port'] || $old_data['app_ips'] != $data['app_ips']
        ) {
            $this->load->model('M_Nginx');
            $certs_created = $this->M_Nginx->create_certs($data);
            $conf = $this->M_Nginx->gen_config();
            $nginx_config_file = $this->config->item('nginx_config_file');
            $config_updated = file_put_contents($nginx_config_file, $conf);
            // Reload nginx without stopping the process
            exec('sudo /opt/telepath/openresty/nginx/sbin/nginx -s reload 2>&1', $outpout);

            xss_return_success([
                'certs_created' => $certs_created,
                'config_updated' => $config_updated,
                'reload_outpout' => $outpout
            ]);
    }

        return_success();

    }

    public function set_app_operation_mode()
    {
        $app_ids = $this->input->post('app_ids');

        array_walk_recursive($app_ids, function (&$value) {
            $value = htmlspecialchars_decode($value, ENT_QUOTES);
        });

        $mode = $this->input->post('mode', true);

        // not use for now
        if ($app_ids == 'all'){

            if ($mode == 3){
                $this->M_Applications->set_all_operation_mode($mode, 2);
                $this->M_Applications->set_all_operation_mode(2, 1);
            }
            else{
                $this->M_Applications->set_all_operation_mode($mode);
            }
        }
        else{

            $this->M_Applications->set_operation_mode($app_ids, $mode);

            $this->load->model('M_Config');

            $apps = [];
            foreach ($app_ids as $app_id) {
                $apps[] = $app_id['host'];
            }
            $this->M_Config->update('app_list_was_changed_id', $apps);

        }
        xss_return_success();

    }


    public function get_ip_suggestion()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $app_id = $this->input->post('app_id', true);

        if (!$app_id) {
            return_fail('No App ID specified');
        }
        $data = $this->M_Applications->get_ip_suggestion($app_id);
        return xss_return_success($data);
    }

    public function del_app()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $app_ids = $this->input->post('app_id');

        if (!$app_ids) {
            return_fail('No App ID specified');
        }
        $flag = 0;
        $gen_config =false;
        foreach ($app_ids as $app_id) {
            // if(in_array($app_id, $this->acl->allowed_apps) || $this->acl->all_apps())
            //$result = $this->Apps->app_delete($app_id);

            $app_id = htmlspecialchars_decode($app_id, ENT_QUOTES);

            // if the deleted applications had an SSL authentication for reverse proxy, we need to delete the
            // certificates and REWRITE OUR NGINX.CONF
            $app = $this->M_Applications->get($app_id);
            if (intval($app['ssl_flag']) == 1 && $app['app_ssl_certificate'] != '' && $app['app_ssl_private'] != '') {
                $this->load->model('M_Nginx');
                $this->M_Nginx->del_certs($app_id);
                $gen_config = true;
            }

            // remove it from elastic search
            $this->M_Applications->delete($app_id);

            $flag = $this->M_Applications->update_flag($app_id);
        }

        if ($gen_config) {
            $conf = $this->M_Nginx->gen_config();
            $this->load->model('M_Config');
            $nginx_config_file = $this->config->item('nginx_config_file');
            file_put_contents($nginx_config_file, $conf);
        }
        xss_return_success(['flag' => $flag]);

    }





}
