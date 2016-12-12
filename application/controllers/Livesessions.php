<?php
if (!defined('BASEPATH')) exit('No direct script access allowed');

class LiveSessions extends Tele_Controller
{
    function __construct()
    {

        parent::__construct();
        $this->load->model('M_Livesessions');

    }

    public function index()
    {
        $host = $this->input->post('host');
        xss_return_success($this->M_Livesessions->index($host));
    }
}