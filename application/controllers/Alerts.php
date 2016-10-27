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

    public function get_alerts()
    {

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';
        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter_session = $this->input->post('actionsFilterSessions');
        $displayed = $this->input->post('displayed');

        if (!$sort || !in_array($sort, array('date', 'name', 'count', 'score'))) {
            $sort = 'date';
        }

        $range = $this->range;
        $apps = $this->apps;

        $alerts = $this->M_Alerts->get_alerts($sort, $dir, $displayed, 15, $range, $apps, $search, $alerts_filter, $actions_filter_session);

        if ($displayed) {
            // We need just the alert items
            return_json($alerts);
        }


        return_success(['alerts' => $alerts]);

    }

// Time chart and Alert filter
    public function get_charts()
    {

        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter_session = $this->input->post('actionsFilterSessions');

        $range = $this->range;
        $apps = $this->apps;

        $time_chart = $this->M_Alerts->get_time_chart($range, $apps, $search, $alerts_filter, $actions_filter_session);
        $distribution_chart = $this->M_Alerts->get_distribution_chart($range, $apps, $search, $actions_filter_session);

        if ($alerts_filter) {
            foreach ($distribution_chart as $key => $dis) {
                if (!in_array($dis['label'], $alerts_filter)) {
                    $distribution_chart[$key]['data'] = 0;
                }
            }
        }

        return_success([
            'time_chart' => $time_chart,
            'distribution_chart' => $distribution_chart
        ]);

    }

// BA filter data
    public function get_action_distribution_chart()
    {

        $search = $this->input->post('search');
        $alerts_filter = $this->input->post('alertsFilter');
        $actions_filter = $this->input->post('actionsFilter');

        $range = $this->range;
        $apps = $this->apps;

        $action_distribution_chart = $this->M_Alerts->get_action_distribution_chart($range, $apps, $search, $alerts_filter);

        if ($actions_filter) {
            foreach ($action_distribution_chart as $key => $dis) {
                if (!in_array($dis['label'], $actions_filter)) {
                    $action_distribution_chart[$key]['data'] = 0;
                }
            }
        }

        return_success(['action_distribution_chart' => $action_distribution_chart]);
    }

    public function get_action_filter_sessions()
    {

        $actions_filter = $this->input->post('actionsFilter');

        $range = $this->range;
        $apps = $this->apps;

        $action_filter_sessions = $this->M_Alerts->get_action_filter_sessions($actions_filter, $range, $apps);

        return_success(['action_filter_sessions' => $action_filter_sessions]);
    }


}
