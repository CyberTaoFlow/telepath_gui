<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

class Sessionflow extends Tele_Controller
{

    function __construct()
    {

        parent::__construct();
        $this->load->model('M_Sessionflow');

    }

    function get_session_stats()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        // Read input
        $anchor_field='sid';
        $anchor_value=$this->input->post('sid');
        $key = $this->input->post('searchkey');
        $fields = [];
        if ($key){
            $key = json_encode($key);
            $fields = translate_to_elastic_fields($this->input->post('fields'));
        }

        $range = $this->input->post('range') == 'true';
//        $alerts = $this->input->post('alerts');

//        if($alerts && !empty($alerts)){
//            $this->load->model('M_Rules');
//            foreach($alerts as $alert){
//                $rule = $this->M_Rules->get_rule_by_name($alert['key']);
//                if (!empty($rule) && $rule[0]['criteria'][0]['type']=="IP") {
//                    $anchor_field='ip_orig';
//                    $anchor_value=$this->input->post('ip');
//                    break;
//                }
//            }
//        }

        if ($range){
            $range = $this->_get_range();
        }

//        if (!empty($key) && substr($key, -1) != '*' && strpos($key, 'country_code') !== 0)
//        {
//            $key = str_replace('OR*','OR',str_replace('AND*','AND',str_replace(' ','* ',$key))) . '*';
//        }

        $this->load->model('M_Suspects');
        $suspect_threshold = $this->M_Suspects->get_threshold();


        $stats = $this->M_Sessionflow->get_session_stats($anchor_field, $anchor_value, $key, $fields, $range,
            $suspect_threshold);
        xss_return_success($stats);

    }

    function get_session_scores()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        // Read input
        $anchor_field='sid';
        $anchor_value=$this->input->post('sid');

        $scores = $this->M_Sessionflow->get_session_scores($anchor_field, $anchor_value);
        xss_return_success($scores);

    }


    function get_sessionflow()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        // Read input
        $anchor_field='sid';
        $anchor_value=$this->input->post('sid');
        $filter = $this->input->post('filter');
//        $alerts = $this->input->post('alerts');
        $range = $this->input->post('range') == 'true';

//        if($alerts && !empty($alerts)){
//            $this->load->model('M_Rules');
//            foreach($alerts as $alert){
//                $rule = $this->M_Rules->get_rule_by_name($alert['key']);
//                if (!empty($rule) && $rule[0]['criteria'][0]['type']=="IP") {
//                    $anchor_field='ip_orig';
//                    $anchor_value=$this->input->post('ip');
//                    break;
//                }
//            }
//        }

        $key = $this->input->post('searchkey');
        $fields = [];
        if ($key){
            $key = json_encode($key);
            $fields = translate_to_elastic_fields($this->input->post('fields'));
        }

//        if (!empty($key) && substr($key, -1) != '*' && strpos($key, 'country_code') !== 0)
//        {
//            $key = str_replace('OR*','OR',str_replace('AND*','AND',str_replace(' ','* ',$key))) . '*';
//        }

        $offset = intval($this->input->post('offset')) > 0 ? intval($this->input->post('offset')) : 0;


        if ($range){
            $range = $this->_get_range();
        }

        $suspect_threshold = 0.8;

        if ($filter == 'Suspects'){
            $this->load->model('M_Suspects');
            $suspect_threshold = $this->M_Suspects->get_threshold();
        }


        $sessionflow = $this->M_Sessionflow->get_sessionflow($anchor_field, $anchor_value, $offset, 100, $filter,
            $key, $fields, $range, $suspect_threshold);
        xss_return_success($sessionflow);

    }

    public function get_sessionflow_params()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $uid = $this->input->post('uid', true);
        $params = $this->M_Sessionflow->get_sessionflow_params($uid);

        xss_return_success($params);

    }


}
