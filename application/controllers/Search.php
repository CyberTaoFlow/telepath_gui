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
            'displayed' => $this->input->post('displayed')

        );

    }

    // Cases thread
    public function cases()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        return_success($this->M_Search->search('cases', $this->_getSettings()));
    }

    // Alerts thread
    public function alerts()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        return_success($this->M_Search->search('alerts', $this->_getSettings()));
    }

    // Suspects thread
    public function suspects()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        $this->load->model('M_Suspects');
        $suspect_threshold = $this->M_Suspects->get_threshold();
        return_success($this->M_Search->search('suspects', $this->_getSettings(), $suspect_threshold));
    }

    // Requests thread
    public function requests()
    {
        telepath_auth(__CLASS__, __FUNCTION__, $this);
        $this->load->model('M_Suspects');
        $suspect_threshold = $this->M_Suspects->get_threshold();
        return_success($this->M_Search->search('requests', $this->_getSettings(), $suspect_threshold));
    }

    function getAutoComplete()
    {
        $search = $this->input->post('search');
        $range = $this->_get_range();
        $apps = $this->_get_apps();

        return_success($this->M_Search->getAutoComplete($search, $range, $apps)) ;

    }

}
