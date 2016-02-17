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
        $data = isset($parsed['app_filter']) ? $parsed['app_filter'] : array();

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
        $this->elasticClient = new Elasticsearch\Client();
//		unset($params);

        $params['body'] = array(
            'size' => 0,
            'facets' => [
                'ts' => [
                    'statistical' => [
                        'field' => 'ts'
                    ]
                ]
            ]
        );

        $results = $this->elasticClient->search($params);
        $parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;

        $parsed['time_range'] = array('start' => $results['facets']['ts']['min'], 'end' => $results['facets']['ts']['max']);

        $user = $this->ion_auth->update($this->user_id, array('extradata' => json_encode($parsed)));
        if (!$user) {
            return_fail($this->ion_auth->errors());
        }

        return_success($parsed['time_range']);

    }

    public function _set_time_range()
    {

        $start = intval($this->input->post('start'));
        $end = intval($this->input->post('end'));

        if (!$start || !$end || $start > $end) {
            return_json(array('success' => false));
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
        $parsed['time_range'] = array('start' => $start, 'end' => $end);

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

        $data = isset($parsed['time_range']) ? $parsed['time_range'] : array('start' => time(), 'end' => strtotime('-7 day'));

        if ($local) {
            return $data;
        }

        return_success($data);

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

        $this->redisObj = new Redis();
        $this->redisObj->connect('localhost', '6379');


    }
}

?>