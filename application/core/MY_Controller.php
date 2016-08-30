<?php

class Tele_Controller extends CI_Controller
{

    public function _get_apps()
    {
        return $this->_get_app_filter(true);
    }

    public function _get_range()
    {
        return $this->_get_time_range(true);
    }

    public function _set_app_filter()
    {

        $apps = $this->input->post('apps');
        if (!is_array($apps)) {
            $apps = array();
        }

        $this->user_id = $this->ion_auth->get_user_id();

        if ($this->user_id) {
            $this->user = $this->ion_auth->user($this->user_id)->result();
            if (!isset($this->user[0])) {
                return;
            }
            $this->user = (array)$this->user[0];
        } else {
            return;
        }

        $parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;
        $parsed['app_filter'] = $apps;

        $user = $this->ion_auth->update($this->user_id, array('extradata' => json_encode($parsed)));
        if (!$user) {
            return_fail($this->ion_auth->errors());
        }

        return_success();

    }

    public function _get_app_filter($local = false)
    {
        $this->load->model('M_Applications');

        $this->user_id = $this->ion_auth->get_user_id();

        if ($this->user_id) {
            $this->user = $this->ion_auth->user($this->user_id)->result();
            if (!isset($this->user[0])) {
                return;
            }
            $this->user = (array)$this->user[0];
        } else {
            return;
        }

        $parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;
        $data = array();
        if (isset($parsed['app_filter'])) {
            $data = $parsed['app_filter'];
            // Add subdomains
            if ($local) {
                foreach ($parsed['app_filter'] as $root_domain) {
                    if ($subdomains = $this->M_Applications->get_subdomains($root_domain)) {
                        $data = array_merge($data, $subdomains);
                    }
                }
            }
        }


        if ($local) {
            return $data;
        }

        return_success($data);

    }

    public function _set_full_time_range()
    {

        $this->user_id = $this->ion_auth->get_user_id();

        if ($this->user_id) {
            $this->user = $this->ion_auth->user($this->user_id)->result();
            if (!isset($this->user[0])) {
                return;
            }
            $this->user = (array)$this->user[0];
        } else {
            return;
        }

        // GET ELASTIC MIN/MAX
        $params = array();
//		$params['hosts'] = array ('127.0.0.1:9200');
//        $this->elasticClient = new Elasticsearch\Client();
//		unset($params);

        // Change to the new query instead of the deprecated Statistical Facet (MOSHE)
        $params['index']='telepath-20*';
        $params['body'] = array(
            'size' => 0,
            'aggs' => [
                'grades_stats' => [
                    'extended_stats' => [
                        'field' => 'ts'
                    ]
                ]
            ]
        );

        $results = $this->elasticClient->search($params);
        $parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;

        if (!isset($results['aggregations']['grades_stats']['min'])){
            $results['aggregations']['grades_stats']['max']=time();
            $results['aggregations']['grades_stats']['min']=$results['aggregations']['grades_stats']['max']-86400;
        }

        $parsed['time_range'] = array( 'start' => $results['aggregations']['grades_stats']['min'], 'end' => $results['aggregations']['grades_stats']['max']);

        $parsed['time_range']['state']='range';
        $user = $this->ion_auth->update($this->user_id, array('extradata' => json_encode($parsed)));
        if (!$user) {
            return_fail($this->ion_auth->errors());
        }

        return_success($parsed['time_range']);

    }

    public function _get_first_data_time(){
        $params['index']='telepath-20*';
        $params['body'] = array(
            'size' => 0,
            'aggs' => [
                'min_time' => [
                    'min' => [
                        'field' => 'ts'
                    ]
                ]
            ]
        );
        $result = $this->elasticClient->search($params);

        if(isset($result["aggregations"]) &&
            isset($result["aggregations"]["min_time"]) &&
            isset($result["aggregations"]["min_time"]["value"]) &&
            !empty($result["aggregations"]["min_time"]["value"])) {
            $min_time = $result['aggregations']['min_time']['value'];
        }
        else{
            // if there is no data, send default one day ago
            $min_time = time() - 86400;
        }

        return $min_time;

    }

    public function _set_time_range()
    {

        $state=$this->input->post('state');

        if ($state=='range'){
            $start = intval($this->input->post('start'));
            $end = intval($this->input->post('end'));

            if (!$start || !$end || $start > $end) {
                return_json(array('success' => false));
            }
        }

        $this->user_id = $this->ion_auth->get_user_id();

        if ($this->user_id) {
            $this->user = $this->ion_auth->user($this->user_id)->result();
            if (!isset($this->user[0])) {
                return;
            }
            $this->user = (array)$this->user[0];
        } else {
            return;
        }

        $parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;
        if ($state=='range'){
            $parsed['time_range'] = array('state'=>$state, 'start' => $start, 'end' => $end);
        }
        else
            $parsed['time_range'] = array('state'=>$state);

        $user = $this->ion_auth->update($this->user_id, array('extradata' => json_encode($parsed)));
        if (!$user) {
            return_fail($this->ion_auth->errors());
        }

        return_success();

    }

    public function _get_time_range($local = false)
    {

        $this->user_id = $this->ion_auth->get_user_id();

        if ($this->user_id) {
            $this->user = $this->ion_auth->user($this->user_id)->result();
            if (!isset($this->user[0])) {
                return;
            }
            $this->user = (array)$this->user[0];
        } else {
            return;
        }

        $parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;
//        $data = isset($parsed['time_range']) ? $parsed['time_range'] : array( 'end'=> time(), 'start' => strtotime('-7 day'));
        if (isset($parsed['time_range']) && array_key_exists("state", $parsed['time_range'])) {
            switch ($parsed['time_range']['state']) {
                case 'year':

                    $data = array('state' => 'year', 'start' => strtotime('-1 year'), 'end' => time());
                    break;

                case 'month':

                    $data = array('state' => 'month', 'start' => strtotime('-1 month'), 'end' => time());

                    break;
                case 'week':

                    $data = array('state' => 'week', 'start' => strtotime('-1 week'), 'end' => time());

                    break;
                case 'day':

                    $data = array('state' => 'day', 'start' => strtotime('-1 day'), 'end' => time());

                    break;

                case 'hour':

                    $data = array('state' => 'hour', 'start' => strtotime('-1 hour'), 'end' => time());

                    break;

                case 'data':

                    $data = array('state' => 'data', 'start' => $this->_get_first_data_time(), 'end' => time());

                    break;

                case 'range':
                    $data = array('state' => 'range', 'start' => $parsed['time_range']['start'], 'end' => $parsed['time_range']['end']);
                    break;

                default:
                    $data = array('state' => 'week', 'start' => strtotime('-1 week'), 'end' => time());
                    break;

            }
        }
        else
            $data = array('state' => 'week', 'start' => strtotime('-1 week'), 'end' => time());

        $data['indices'] = $this->range_to_indices($data);


        if ($local) {
            return $data;
        }

        return_success($data);

    }

    // get a specific range, return the relevant indices
    function range_to_indices($range)
    {
        if ($range['state'] != 'data' && $range['start'] > $this->_get_first_data_time()) {

            $indices = [];

            $period = new DatePeriod(
                new DateTime(date("Y-m-d", $range['start'])),
                new DateInterval('P1D'),
                new DateTime(date("Y-m-d", $range['end'] + 86400)) // Add 1 day because the Period Class doesn't
            // return the last day
            );

            foreach ($period as $date) {
                $indices[] = 'telepath-' . $date->format("Ymd");
            }

            // Check if all indices exists
            if ($this->elasticClient->indices()->exists(['index' => $indices])) {
                return $indices;
            }
        }

        return 'telepath-20*';

    }

    function __construct()
    {

        parent::__construct();

        // ElasticSearch Library
        require 'vendor/autoload.php';
        // Connect elastic
        //$params = array('hosts' => array('127.0.0.1:9200'));
        $this->elasticClient = new Elasticsearch\Client();

        $params = [
            'index' => 'telepath-config',
            'type' => 'config',
            'body' => [
                'query' => [
                    'match_all' => [
                    ],
                ],
            ]
        ];


        if (!$this->elasticClient->test_search($params)) {

            echo $this->load->view('db_not_connected','',true);
            die();
        }

//        $this->redisObj = new Redis();
//        $this->redisObj->connect('localhost', '6379');


    }
}

?>