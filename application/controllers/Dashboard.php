<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends Tele_Controller
{

    private $range;
    private $apps;

    function __construct()
    {
        parent::__construct();
        $this->load->model('M_Dashboard');
        $this->load->model('M_Suspects');
        $this->range = $this->_get_range();
        $this->apps = $this->_get_apps();

    }

    public function get_map()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->range;
        $apps = $this->apps;
        $map_mode = $this->input->post('map_mode');

        $map = $this->M_Dashboard->get_map($range, $apps, $map_mode);

        $data = array('map' => $map, 'map_mode'=>$map_mode);

        return_success($data);

    }

    public function get_chart()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->range;
        $apps = $this->apps;

        $suspect_threshold = $this->M_Suspects->get_threshold();

        $chart = $this->M_Dashboard->get_chart($range, $apps, $suspect_threshold);

        $data = array('chart' => $chart);

        return_success($data);

    }

    public function get_gap_score($learning=false)
    {
//        telepath_auth(__CLASS__, __FUNCTION__);
//        $range = $this->range;
//        $apps = $this->apps;
        if(isset ($learning) && $learning=='learning'){
            $learning=true;
        }
        else{
            $learning=false;
        }
        $data = $this->M_Dashboard->get_gap_score($learning);

        return_success($data);

    }



    public function get_suspects()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->range;
        $apps = $this->apps;

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';

        $suspect_threshold = $this->M_Suspects->get_threshold();

        $suspects ['items'] = [];
        $ips = [];

        // Get 5 top suspects with distinct IP. If we get less than 5 items, we send another query to get more items,
        // but we need to exclude the ips that we got already
        while (sizeof($suspects ['items']) < 5) {
            $results = $this->M_Suspects->dashboard_get($range, $apps, $sort, $dir, 5 - sizeof($suspects ['items']), $suspect_threshold, $ips);
            if (empty($results['items'])) {
                break;
            }
            $suspects['items'] = array_merge($suspects['items'], $results['items']);
            $ips = array_merge($ips, $results['ips']);
        }

        $suspects['query'] = $results['query'];
        $suspects['std'] = $results['std'];


        # Fix the problem we have with sort. When we sort by date we get other requests with the same session id.
        # As a result we need to perform a second sort.
        if ($sort == 'date') {

            if ($dir == 'ASC') {
                $dir = SORT_ASC;
            } elseif ($dir == 'DESC') {
                $dir = SORT_DESC;
            }

            $temp = array();
            $ar = $suspects['items'];
            foreach ($ar as $key => $row) {
                $temp[$key] = $row['date'];
            }
            array_multisort($temp, $dir, $ar);
            $suspects['items'] = $ar;
        }

        $data = array('suspects' => $suspects);

        return_success($data);

    }

    public function get_alerts()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->range;
        $apps = $this->apps;

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';

        $this->load->model('M_Alerts');
        $alerts ['items'] = [];
        $sessions_id = [];
        $sessions_details = [];

        // Get 5 sessions with distinct details. If we get less than 5 items, we send another query to get more items,
        // but we need to exclude the sessions that we got already
        while (sizeof($alerts ['items']) < 5) {
            $results = $this->M_Alerts->dashboard_get_alerts($sort, $dir, 5 - sizeof($alerts['items']), $range, $apps,
                $sessions_id, $sessions_details);
            if (empty($results['items'])) {
                break;
            }
            $alerts['items'] = array_merge($alerts['items'], $results['items']);
            $sessions_id = array_merge($sessions_id, $results['sessions_id']);
            $sessions_details = $sessions_details + $results['sessions_details'];
        }

        $alerts['query'] = $results['query'];

        if ($sort == 'date') {

            if ($dir == 'ASC') {
                $dir = SORT_ASC;
            } elseif ($dir == 'DESC') {
                $dir = SORT_DESC;
            }

            # Fix the problem we have with sort.
            # When sorting alerts by date we get other requests
            # with the same session id. As a result we need to perform
            # second sort.
            $temp = array();
            $ar = $alerts['items'];
            foreach ($ar as $key => $row) {
                $temp[$key] = $row['date'];
            }
            array_multisort($temp, $dir, $ar);
            $alerts['items'] = $ar;
        }

        $data = array('alerts' => $alerts);

        return_success($data);

    }

    public function get_cases()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $range = $this->range;
        $apps = $this->apps;

//        $cases = $this->M_Dashboard->get_cases($range, $apps);

        $this->load->model('M_Cases');

        $all = $this->M_Cases->get_case_data('all');

        if(empty($all)){
            return_success();
        }

        $res0 = $this->M_Cases->get(100, $range, $apps);
        $cases = array();

        if (!isset($all[0])){
            $all=array($all);
        }
        foreach ($all as $tmp) {

            $found = false;
            foreach ($res0 as $case) {
                if ($case['name'] == $tmp['case_name']) {
                    $found = true;
                    $cases[] = $case;
                    break;
                }
            }

            if ($found == false) {
                $cases[] = array('name' => $tmp['case_name'], 'count' => 0, 'checkable' => false, 'case_data' => $tmp);
            }
        }
        # Make sure we have only 5 cases in the dashboard report, Yulli
        $result=[];
        foreach ($cases as $case){
            if (isset ($case['case_data']['favorite']) && $case['case_data']['favorite']){
                $result[]=$case;
            }
        }
        if (count($result)<5 && count($result)>0){
            foreach ($cases as $case){
                foreach ($result as $res) {
                    if ($case['name'] != $res['name'] && count($result) < 5) {
                        $result[] = $case;
                    }
                }
            }
        }
        elseif (count($result)==0){
            $result= array_slice($cases,0,5);
        }
        else{
            $result= array_slice($result,0,5);
        }


        $data = array('cases' => $result);

        return_success($data);

    }


}
