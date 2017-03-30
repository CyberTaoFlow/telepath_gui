<?php if (!defined('BASEPATH')) exit('No direct script access allowed');


class Actions extends Tele_Controller
{

    public function __construct()
    {

        parent::__construct();
        $this->load->model('M_Actions');

    }

    public function set_delete_action()
    {

        // telepath_auth(__CLASS__, 'set_action');

        $host = $this->input->post('application');
        $action = $this->input->post('action');
        $uid = $this->input->post('uid');

       $this->M_Actions->set_delete_action($uid);

        $this->load->model('M_Config');
        $this->M_Config->update('business_flow_was_changed_id', '1');

        xss_return_success($uid);

    }

    public function get_action_autocomplete()
    {

        telepath_auth(__CLASS__, 'get_action');

        $text = $this->input->post('text', true);
        $text = str_replace(":", "", $text);
        $text = trim($text);

        xss_return_success($this->M_Actions->get_action_autocomplete($text)) ;


    }


    public function get_app_actions()
    {

        telepath_auth(__CLASS__, 'get_action');

        $host = $this->input->post('host');
        $domain=$this->input->post('domain');

        $actions=$this->M_Actions->get_app_actions($host);


        if($domain=='root'){
        $this->load->model('M_Applications');
            $subdomains=$this->M_Applications->get_subdomains($host);
            }
        if(!isset($subdomains) || !$subdomains){
            $subdomains=[];
        }

        xss_return_success(array('actions'=>$actions,'subdomains'=>$subdomains));
    }

    public function check_existing_action_name()
    {

        telepath_auth(__CLASS__, 'get_action');

        $host = $this->input->post('host');
        $name = $this->input->post('name');

        $actions = $this->M_Actions->get_app_actions($host);

        $exist = false;
        foreach ($actions as $action) {
            if ($action['action_name'] == $name) {
                $exist = true;
                break;
            }
        }

        return_success($exist);



    }


    public function set_flow()
    {

        telepath_auth(__CLASS__, 'set_action');

        $app = $this->input->post('app');
        $name = $this->input->post('flow_name');
        $data = $this->input->post('json');
        $data = json_decode($data);

        $this->M_Actions->set_flow($name,$app,$data);

        $this->load->model('M_Config');
        $this->M_Config->update('business_flow_was_changed_id', '1');

        return_success();

    }

    public function _hybridrecord_to_sid($value, $host)
    {

        xss_return_success($this->M_Actions->_hybridrecord_to_sid($value,$host)) ;

    }

    public function get_requests()
    {

        telepath_auth(__CLASS__, 'get_action');

        $id = $this->input->post('id');

        xss_return_success($this->M_Actions->get_requests($id)) ;

    }

    public function start_recording()
    {

        telepath_auth(__CLASS__, 'set_action');

        // Mode, either IP, URL or Session (sha256_sid field) for USER
        $mode = $this->input->post('mode');
        // The value for the mode
        $value = $this->input->post('value');
        // Host on which to track, can be black for cross host sessions
        $host = extractRootDomain($this->input->post('host'));
        // Random id for Redis key
        $id = mt_rand();

        // Send record message to Redis, to begin the fast lane record
        if ($this->M_Actions->send_record_message($id, $mode, $value, $host)) {
            xss_return_success(['id' => $id, 'mode' => $mode, 'value' => $value, 'host' => $host]);
        } else {
            return_fail($id);
        }

    }


    public function end_record()
    {
        telepath_auth(__CLASS__, 'set_action');

        // Redis key
        $id = $this->input->post('id');

        // Send message to Redis to stop the fast lane, and delete the queue
        $sent = $this->M_Actions->send_record_message($id);
        $delete = $this->M_Actions->delete_record_queue($id);


        xss_return_success(['sent' => $sent, 'delete' => $delete]);

    }

    public function get_suggest()
    {

        telepath_auth(__CLASS__, 'get_action');

        $host = $this->input->post('host');
        $mode = $this->input->post('mode');

        $res = array();

        switch ($mode) {

            //IP mode
            case 'i':

                $res = $this->M_Actions->__get_active_ips($host);

                break;

            // user mode (sha256_sid field)
            case 's':

                $res = $this->M_Actions->__get_active_users($host);

                break;
        }

        xss_return_success($res);

    }

    // Track specific session
    public function track_session_by_sid()
    {

        $sid = $this->input->post('sid'); // at this sid
        $offset = $this->input->post('time'); // starting this stamp

        xss_return_success($result);

    }

//    public function get_app_with_actions()
//    {
//
//        telepath_auth(__CLASS__, __FUNCTION__, $this);
//
//        $search = $this->input->post('search');
//
////        $res = $this->redisObj->get('cache_applications');
//
//        /*if (isset($res) && $res) {
//            $data = json_decode($res);
//            if ($data && !empty($data)) {
//                xss_return_success($data);
//            }
//        }*/
//
//        if ($search){
//
//            $data=$this->M_Actions->get_app_with_actions($search);
//
//        }
//
//        else{
//
//            $data = $this->M_Applications->index($search);
//
//        }
//
//
//        $this->redisObj->set('cache_applications', json_encode($data), 600);
//
//        xss_return_success($data);
//
//    }

}
