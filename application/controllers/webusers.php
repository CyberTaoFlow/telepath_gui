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
        return_success($this->M_Users->store_users());

    }


    public function get_users()
    {
        $search = $this->input->post('search');

        return_success($this->M_Users->get_users($search));
    }
}