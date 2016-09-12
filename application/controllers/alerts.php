<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Alerts extends Tele_Controller
{
    private $range;
    private $apps;

    function __construct()
    {
        parent::__construct();
        $this->load->model('M_Alerts');
        $this->range = $this->_get_range();
        $this->apps = $this->_get_apps();
    }

    public function index()
    {

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';
        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter = $this->input->post('actionsFilter');
//        if ($search && substr($search, -1) != '*' && $search[0]!='"' && substr($search, -1) != '"' && strpos($search, 'country_code') !== 0)
//        {
//            $search = str_replace('OR*','OR',str_replace('AND*','AND',str_replace(' ','* ',$search))) . '*';
//
//        }
//        $offset = intval($this->input->post('offset')) > 0 ? intval($this->input->post('offset')) : 0;

        $displayed = $this->input->post('displayed');

        if (!$sort || !in_array($sort, array('date', 'name', 'count', 'score'))) {
            $sort = 'date';
        }

        $range = $this->_get_range();
        $apps = $this->_get_apps();


        // Prep filter
//        $filter = array();

        $actions_sid=[];
        //Action filter
        if (count($actions_filter) > 0 && $actions_filter != false) {

            $actions_sid = $this->M_Alerts->get_action_filter($actions_filter, $range, $search, $apps);
        }

        // Alerts Data
        $alerts = $this->M_Alerts->get_alerts($sort, $dir, $displayed, 15, $range, $apps, $search, $alerts_filter, $actions_sid);

        if ( $displayed ) {
            // We need just the alert items
            return_json($alerts);
        }

        $time_chart = $this->M_Alerts->get_time_chart($range, $apps, $search, $alerts_filter, $actions_sid);
        $distribution_chart = $this->M_Alerts->get_distribution_chart($range, $apps, $search);
        $action_distribution_chart = $this->M_Alerts->get_action_distribution_chart($range, $apps, $search, $alerts_filter);


        if ($alerts_filter){
            foreach($distribution_chart as $key => $dis){
                if (!in_array($dis['label'], $alerts_filter)){
                    $distribution_chart[$key]['data']=0;
                }
            }
        }
        if ($actions_filter){
            foreach($action_distribution_chart as $key => $dis){
                if (!in_array($dis['label'], $actions_filter)){
                    $action_distribution_chart[$key]['data']=0;
                }
            }
        }


        return_success(
            array(
                'alerts' => $alerts,
                'time_chart' => $time_chart,
                'distribution_chart' => $distribution_chart,
                'action_distribution_chart' => $action_distribution_chart
            )
        );

    }

    public function get_alerts()
    {

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';
        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter = $this->input->post('actionsFilter');
        $displayed = $this->input->post('displayed');

        if (!$sort || !in_array($sort, array('date', 'name', 'count', 'score'))) {
            $sort = 'date';
        }

        $range = $this->range;
        $apps = $this->apps;

        $actions_sid=[];
        //Action filter
        if (count($actions_filter) > 0 && $actions_filter != false) {

            $actions_sid = $this->M_Alerts->get_action_filter($actions_filter, $range, $search, $apps);
        }

        $alerts = $this->M_Alerts->get_alerts($sort, $dir, $displayed, 15, $range, $apps, $search, $alerts_filter,
            $actions_sid);

        if ( $displayed ) {
            // We need just the alert items
            return_json($alerts);
        }


        return_success(['alerts' => $alerts]);

    }

   
    public function get_charts()
    {

        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter = $this->input->post('actionsFilter');

        $range = $this->range;
        $apps = $this->apps;

        $actions_sid=[];
        //Action filter
        if (count($actions_filter) > 0 && $actions_filter != false) {

            $actions_sid = $this->M_Alerts->get_action_filter($actions_filter, $range, $search, $apps);
        }


        $time_chart = $this->M_Alerts->get_time_chart($range, $apps, $search, $alerts_filter, $actions_sid);
        $distribution_chart = $this->M_Alerts->get_distribution_chart($range, $apps, $search);

        if ($alerts_filter) {
            foreach ($distribution_chart as $key => $dis) {
                if (!in_array($dis['label'], $alerts_filter)) {
                    $distribution_chart[$key]['data'] = 0;
                }
            }
        }

        return_success(['time_chart' =>$time_chart,
            'distribution_chart' =>$distribution_chart]);

    }


    public function get_action_distribution_chart()
    {

        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter = $this->input->post('actionsFilter');

        $range = $this->range;
        $apps = $this->apps;

        $action_distribution_chart = $this->M_Alerts->get_action_distribution_chart($range, $apps, $search,
            $alerts_filter);

        if ($actions_filter) {
            foreach ($action_distribution_chart as $key => $dis) {
                if (!in_array($dis['label'], $actions_filter)) {
                    $action_distribution_chart[$key]['data'] = 0;
                }
            }
        }

        return_success(['action_distribution_chart' =>$action_distribution_chart]);
    }





    

}
