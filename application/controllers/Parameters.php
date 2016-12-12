<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

class Parameters extends Tele_Controller
{

    function __construct()
    {
        parent::__construct();

    }

    function get_global_headers()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $this->load->model('M_Globalheaders');
        $headers = $this->M_Globalheaders->get_global_headers();

        $ans = [];

        foreach ($headers as $header) {
            $ans[] = $header;
        }
        $ans[] = 'user-agent';
        sort($ans);
        return_success($ans) ;

    }
    
}