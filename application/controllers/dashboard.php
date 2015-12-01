<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends Tele_Controller
{

    function __construct()
    {
        parent::__construct();
        $this->load->model('M_Dashboard');
    }

    public function get_map()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $map = $this->M_Dashboard->get_map($range, $apps);

        $data = array('map' => $map);

        return_success($data);

    }

    public function get_chart()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $chart = $this->M_Dashboard->get_chart($range, $apps);

        $data = array('chart' => $chart);

        return_success($data);

    }

    public function get_suspects()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';

        $suspects = $this->M_Dashboard->get_suspects($range, $apps, $sort, $dir);

        $data = array('suspects' => $suspects);

        return_success($data);

    }

    public function get_alerts()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';

        $alerts = $this->M_Dashboard->get_alerts($range, $apps, $sort, $dir);

        $data = array('alerts' => $alerts);

        return_success($data);

    }

    public function get_cases()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $cases = $this->M_Dashboard->get_cases($range, $apps);
        # Make sure we have only 5 cases in the dashboard report, Yulli
        $cases = array_slice($cases, 0, 5);

        $data = array('cases' => $cases);

        return_success($data);

    }

    public function index()
    {

        // Mode is used for returning only map data

        $mode = $this->input->post('mode');
        if ($mode) {

            $range = $this->_get_range();
            $apps = $this->_get_apps();

            switch ($mode) {

                case 'map_alerts':

                    $map = $this->M_Dashboard->get_map($range, $apps);
                    return_success(array('map' => $map));

                    break;
                case 'map_traffic':

                    $traffic = $this->M_Dashboard->get_map($range, $apps, false);
                    return_success(array('traffic' => $traffic));

                    break;

            }

            return;
        }
        /*
        $hash1 = md5(serialize($range));
        $hash2 = md5(serialize($apps));
        $hash  = md5($hash1 . $hash2);

        $redisObj = new Redis();
        $redisObj->connect('localhost', '6379');
        $res = $redisObj->get('cache_dashboard_' . $hash);
        */
        /*
                if($res && $res != '') {
                    $data = json_decode($res);
                    if($data && !empty($data)) {
                        return_success($data);
                    }
                }
        */
        // Return everything ..

    }

}
