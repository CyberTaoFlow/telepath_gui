<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Telepath extends Tele_Controller
{

    private $processName = 'telewatchdog';
    private $startFunction = 'sudo /opt/telepath/bin/telepath start';
    private $stopFunction = 'sudo /opt/telepath/bin/telepath stop';
    private $checkFunction = 'sudo /opt/telepath/bin/telepath check';
    private $restartFunction = 'sudo /opt/telepath/bin/telepath restart';

    public function set_engine_start()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        exec($this->startFunction . " > /dev/null &");
        return_json(array('success' => true, 'status' => 'started'));

    }

    public function set_engine_stop()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        exec($this->stopFunction . " > /dev/null &");
        return_json(array('success' => true, 'status' => 'stopped'));

    }

    public function set_engine_restart()
    {
        telepath_auth(__CLASS__, __FUNCTION__);
        exec($this->restartFunction . " > /dev/null &");
        return_json(array('success' => true, 'status' => 'restarted'));
    }

    public function get_engine_status()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        exec("pgrep " . $this->processName, $output, $return);
        $found = $return == 0;
        return_json(array('success' => true, 'status' => $found));
    }

    public function set_app_filter()
    {
        $this->_set_app_filter();
    }

    public function get_app_filter()
    {
        $this->_get_app_filter();
    }

    //not used
    /*public function set_full_time_range()
    {
        $this->_set_full_time_range();
    }*/

    public function get_first_data_time()
    {
        return_success($this->_get_first_data_time()) ;
    }

    public function set_time_range()
    {
        $this->_set_time_range();
    }

    public function get_time_range()
    {
        $this->_get_time_range();
    }

    public function check()
    {

        $this->load->model('M_Config');
        $key = $this->input->post('key');
        $this->M_Config->update('license_key_id', $key);

        // Check every 3 seconds if the status string was changed by the engine
        $old_status = $this->M_Config->get_key('license_mode_id');
        $new_status = $old_status;

        while ($new_status == $old_status) {
            sleep(3);
            $new_status = $this->M_Config->get_key('license_mode_id');
        }

        // Add variable to session data to prevent anyone else from registering
        $new_installation = $this->M_Config->check_new_installation();

        if ($new_status == 'VALID' && $new_installation){
            $_SESSION['register'] = true;
        }

        return_json(array('success' => true, 'status' => $new_status));

    }

    public function index()
    {

        // Figure Licence
        $this->load->model('M_Config');
        $licence_valid = $this->M_Config->get_key('license_mode_id') == 'VALID';

        $new_installation = $this->M_Config->check_new_installation();

        // Figure Login
        $logged_in = $this->ion_auth->logged_in();

        // Either login / ui
        if ($licence_valid) {
           // Only the user that enter the correct license key can register
            if ($new_installation) {
                if(isset($_SESSION['register']) && $_SESSION['register']){
                    $this->load->view('register');
                }else{
                    $this->load->view('license');
                }
            }
            else{
                if ($logged_in) {
                    $this->load->view('telepath');
                } else {
                    $this->load->view('login');
                }
            }
        } else { // Or show license window
            $this->load->view('license');
        }

    }

    public function header()
    {
        $this->load->view('header');
    }

    public function templates()
    {

        $path = realpath('.') . '/tpl/';
        $out = array();
        $templates = array_diff(scandir($path), array('.', '..', '.svn'));

        foreach ($templates as $template) {
            if (substr($template, -4) != 'html') {
                continue;
            } // Make sure its an html file
            $out[substr($template, 0, -5)] = file_get_contents($path . $template);
        }

        echo json_encode($out);

    }

}
