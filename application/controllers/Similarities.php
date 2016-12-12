<?php


defined('BASEPATH') OR exit('No direct script access allowed');

class Similarities extends Tele_Controller
{

    public function __construct()
    {

        parent::__construct();

    }

    public function index()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $this->load->model('M_Requests');

        $uid = $this->input->post('uid');
        $req = $this->M_Requests->get_similar($uid);

        return_success($req);

    }


}

?>