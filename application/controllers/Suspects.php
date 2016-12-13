<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Suspects extends Tele_Controller
{

    public function index()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $search = $this->input->post('search');
//        if ($search && substr($search, -1) != '*' && $search[0]!='"' && substr($search, -1) != '"' )
//        {
//            $search = str_replace('OR*','OR',str_replace('AND*','AND',str_replace(' ','* ',$search))) . '*';
//
//        }
        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';
//        $offset = intval($this->input->post('offset')) > 0 ? intval($this->input->post('offset')) : 0;
        $displayed = $this->input->post('displayed');

        if (!$sort || !in_array($sort, array('date', 'count', 'alerts'))) {
            $sort = 'date';
        }

        $this->load->model('M_Suspects');
        $suspect_threshold = $this->M_Suspects->get_threshold();
        xss_return_success($this->M_Suspects->get($range, $apps, $sort, $dir, $displayed, 15, $suspect_threshold, $search));

    }

}
