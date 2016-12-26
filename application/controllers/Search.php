<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Search extends Tele_Controller
{

    function __construct()
    {

        parent::__construct();
        $this->load->model('M_Search');
    }

    function _getSettings()
    {

        if ($this->input->post('search') == '') {
            return_fail('No search string defined, aborting');
        }

        $key = $this->input->post('search');

        # Automatically add * to the end of search string
//        if (substr($key, -1) != '*' && $key[0]!='"' && substr($key, -1) != '"' )
//        {
//            $key = str_replace('OR*','OR',str_replace('AND*','AND',str_replace(' ','* ',$key))) . '*';
//
//        }

        $sort = $this->input->post('sort');
        if (!$sort || !in_array($sort, array('date', 'name', 'count', 'score'))) {
            $sort = 'date';
        }
        return array(
            'search' => $key,
//            'options' => $this->input->post('options'),
            'range' => $this->_get_range(),
            //'apps' 	  	 => $this->input->post('apps'),
            'apps' => $this->_get_apps(),
//            'is_country' => $this->input->post('is_country') == 'true', // Comes as string, not boolean
            'sort' => $sort,
            'dir' => $this->input->post('dir') == 'true' ? 'ASC' : 'DESC',
            'displayed' => $this->input->post('displayed') ? $this->input->post('displayed') : []

        );

    }

    // Cases thread
    public function cases()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        $settings = $this->_getSettings();
        $cases = $this->M_Search->search('cases', $settings);
        if (isset($cases['items']) && $settings['sort'] == 'date') {
            $cases['items'] = sort_by_date($cases['items'], $settings['dir']);
        }
        xss_return_success($cases);
    }

    // Alerts thread
    public function alerts()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        $settings = $this->_getSettings();
        $alerts = $this->M_Search->search('alerts', $settings);
        if (isset($alerts['items']) && $settings['sort'] == 'date') {
            $alerts['items'] = sort_by_date($alerts['items'], $settings['dir']);
        }
        xss_return_success($alerts);
    }

    // Suspects thread
    public function suspects()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        $this->load->model('M_Suspects');
        $settings = $this->_getSettings();
        $suspect_threshold = $this->M_Suspects->get_threshold();

        $suspects['items'] = [];
        // Separate duplicated sessions from displayed sessions. We need them both to retrieve the next batch, but we
        // need only the duplicated sessions to add them to the displayed sessions in client side.
        $duplicated_sessions = [];
        $displayed_sessions = [];

        // Display 15 sessions in all situation, even if there was duplicated sessions with the alert tab
        while (sizeof($suspects ['items']) < 15) {

            $settings['displayed'] = array_merge($settings['displayed'], $duplicated_sessions);
            $settings['displayed'] = array_merge($settings['displayed'], $displayed_sessions);

            $results =
                $this->M_Search->search('suspects', $settings, $suspect_threshold, 15 - sizeof($suspects['items']));

            if (empty($results['items'])) {
                break;
            }

            $suspects['items'] = array_merge($suspects['items'], $results['items']);
            $duplicated_sessions = array_merge($duplicated_sessions, $results['duplicated_sessions']);
            $displayed_sessions = array_merge($displayed_sessions, $results['displayed_sessions']);

            if (ENVIRONMENT == 'development') {
                $suspects['query'] = $results['query'];
            }

            $suspects['total'] = $results['total'];
        }


        $suspects['duplicated_sessions'] = $duplicated_sessions;

        if (isset($suspects['items']) && $settings['sort'] == 'date') {
            $suspects['items'] = sort_by_date($suspects['items'], $settings['dir']);
        }
        xss_return_success($suspects);
    }

    // Requests thread
    public function requests()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        $this->load->model('M_Suspects');
        $suspect_threshold = $this->M_Suspects->get_threshold();
        $settings = $this->_getSettings();

        $requests['items'] = [];
        // Separate duplicated sessions from displayed sessions. We need them both to retrieve the next batch, but we
        // need only the duplicated sessions to add them to the displayed sessions in client side.
        $duplicated_sessions = [];
        $displayed_sessions = [];

        // Display 15 sessions in all situation, even if there was duplicated sessions with the suspects tab and the
        // alerts tab.
        while (sizeof($requests ['items']) < 15) {

            $settings['displayed'] = array_merge($settings['displayed'], $duplicated_sessions);
            $settings['displayed'] = array_merge($settings['displayed'], $displayed_sessions);

            $results =
                $this->M_Search->search('requests', $settings, $suspect_threshold, 15 - sizeof($requests['items']));

            if (empty($results['items'])) {
                break;
            }

            $requests['items'] = array_merge($requests['items'], $results['items']);
            $duplicated_sessions = array_merge($duplicated_sessions, $results['duplicated_sessions']);
            $displayed_sessions = array_merge($displayed_sessions, $results['displayed_sessions']);

            if (ENVIRONMENT == 'development') {
                $requests['query'] = $results['query'];
            }

            $requests['total'] = $results['total'];
        }


        $requests['duplicated_sessions'] = $duplicated_sessions;

        if (isset($alerts['items']) && $settings['sort'] == 'date') {
            $alerts['items'] = sort_by_date($requests['items'], $settings['dir']);
        }
        xss_return_success($requests);
    }

    function getAutoComplete()
    {
        $search = $this->input->post('search');
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        xss_return_success($this->M_Search->getAutoComplete($search, $range, $apps)) ;

    }

}
