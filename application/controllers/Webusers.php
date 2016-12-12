<?php
if (!defined('BASEPATH')) exit('No direct script access allowed');

class WebUsers extends Tele_Controller
{
    function __construct()
    {

        parent::__construct();
        $this->load->model('M_Users');

    }

    public function store_users()
    {
        $this->M_Users->store_users();

    }


    public function get_users()
    {
        $search = $this->input->post('search');
        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'asc' : 'desc';
        $offset = intval($this->input->post('offset')) > 0 ? intval($this->input->post('offset')) : 0;

        xss_return_success($this->M_Users->get_users($search, $sort, $dir, $offset));
    }
}