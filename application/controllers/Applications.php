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
        // separate offsets for applications and actions
        $apps_offset = $this->input->post('appsOffset');
        $actions_offset = $this->input->post('actionsOffset');

        if (!$sort || !in_array($sort, array('host', 'learning_so_far'))) {
            $sort = 'host';
            $dir = 'asc';
        }


        // retrieve the apps if we din't retrieve all the apps in the last batch
        if ($apps_offset != 'finished') {
            $apps_offset = intval($this->input->post('appsOffset')) > 0 ? intval($this->input->post('appsOffset')) : 0;

            $apps = $this->M_Applications->index($search, $learning_so_far, $sort, $dir, $size, $apps_offset);

            if ($apps['finished']) {
                $apps_offset = 'finished';
            } else {
                // Need to count the applications if we don't merge them with the actions
                $apps_offset = sizeof($apps['data']);
            }
        }


        // search in business actions if we din't retrieve all the actions in the last batch
        if ($search && $actions && $actions_offset != 'finished') {

            $actions_offset = intval($this->input->post('actionsOffset')) > 0 ? intval($this->input->post('actionsOffset')) : 0;

            $actions = $this->M_Actions->search_actions($search, $size, $actions_offset, $dir);

            // Before we merge the actions with the applications, we need to be sure that they both match the same
            // alphabetical scope, otherwise the next batch will retrieve data (applications or actions) from
            // applications already displayed
            if (isset($apps)) {

                // Compare alphabetically the last element of each list (applications and actions)
                $last_app = end($apps['data'])['host'];
                $last_action_app = end($actions['data'])['application'];
                $arr = [$last_app, $last_action_app];
                sort($arr);

                // Remove elements from applications list that are alphabetically after the actions list last
                // application
                if (($arr[0] == $last_action_app && $dir == 'asc') || ($arr[0] == $last_app && $dir == 'desc')) {
                    // Remove elements from applications list only if there are enough actions to display
                    if (sizeof($actions['data']) > 50) {
                        foreach (array_reverse($apps['data'], true) as $key => $app) {
                            $arr_cmp = [$app['host'], $last_action_app];
                            sort($arr_cmp);
                            if (($arr_cmp[0] == $last_action_app && $dir == 'asc') || ($arr_cmp[0] == $app['host'] && $dir == 'desc')
                            ) {
                                unset($apps['data'][$key]);
                                // If
                                $apps['finished'] = false;
                            } else {
                                break;
                            }
                        }
                        $apps['data'] = array_values($apps['data']);
                    }
                }
                // Remove elements from actions list that are alphabetically after the applications list last
                // application
                else {
                    // Remove elements from actions list only if there are enough applications to display
                    if (sizeof($apps['data']) > 50) {
                        foreach (array_reverse($actions['data'], true) as $key => $action) {
                            $arr_cmp = [$action['application'], $last_app];
                            sort($arr_cmp);
                            if (($arr_cmp[0] == $last_app && $dir == 'asc') || ($arr_cmp[0] == $action['application'] && $dir
                                    == 'desc')
                            ) {
                                unset($actions['data'][$key]);
                                $actions['finished'] = false;
                            } else {
                                break;
                            }
                        }
                        $actions['data'] = array_values($actions['data']);
                    }
                }

                // Need to count the applications for pagination, before we merge them with the actions
                if (!$apps['finished']) {
                    $apps_offset = sizeof($apps['data']);
                }

                // Need to count the actions for pagination, before we merge them with the applications
                if ($actions['finished']) {
                    $actions_offset = 'finished';
                } else {
                    $actions_offset = sizeof($actions['data']);
                }
            } else {
                $apps = [];
            }


            // Merge actions in relevant application
            foreach ($actions['data'] as $action) {
                //TODO: add option to add an action to a subdomain
                //$root_domain= $this->M_Applications->get_root_domain($action['application']);
                // if the domain already exists, we add the action to this domain
                if (($key = array_search($action['application'], array_column($apps['data'], 'host'))) !== false) {
                    $apps['data'][$key]['actions'][] = $action;
                }
//                elseif($key=array_search($root_domain,array_column($apps['data'],'subdomains'))){
//                    $apps['data'][$key]['subdomains']['actions'][]=$action['action_name'];
//                    $apps['data'][$key]['subdomains']['host']=$action['application'];
//                }
                else {
                    $apps['data'][] = ['host' => $action['application'], 'actions' => [$action]];
                }

            }

        }

        // return the data + the actions count (or 'finished' if all the action data is loaded) and the applications
        // count (or 'finished' if all the application data is loaded) for pagination
        xss_return_success([
            'data' => $apps['data'],
            'apps_offset' => $apps_offset,
            'actions_offset' => $actions_offset
        ]);

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
            $this->M_Applications->delete_from_app_domain($app_id);

            $flag = $this->M_Applications->update_flag($app_id);

            $this->M_Applications->delete_from_indices($app_id);
        }

        if ($gen_config) {
            $conf = $this->M_Nginx->gen_config();
            $this->load->model('M_Config');
            $nginx_config_file = $this->config->item('nginx_config_file');
            file_put_contents($nginx_config_file, $conf);
        }
        xss_return_success(['flag' => $flag]);

    }

    public function mark_low_requests()
    {
        telepath_auth(__CLASS__, __FUNCTION__);

        logger('Start','/var/log/mark_low_requests.log');

        @set_time_limit(-1);

        $apps = $this->M_Applications->get_apps_eta();

        foreach ($apps as $app) {
            // Check if 'eta' is empty (means less than 1000 requests) or eta is more than 30 days
            if (empty($app['eta']) || intval(strstr($app['eta'], 'd', true)) > 30) {
                // If the first request of this application was 2 days ago or more, mark it as low requests
                $first_request_time = $this->M_Applications->first_request_time($app['host']);
                if (!$first_request_time || (time() - $first_request_time > 172800)) {
                    $this->M_Applications->mark_low_request($app['host']);
                    logger('Mark application: '.$app['host']. ' as low requests');
                }
            }
        }
    }





}
