<?php if (!defined('BASEPATH')) exit('No direct script access allowed');



class Config extends Tele_Controller
{

    function __construct()
    {
        parent::__construct();
        $this->load->model('M_Config');
    }

    public function _interfaces()
    {

        $lines = file($this->config->item('interface_file'));

        $interfaces = array();
        for ($i = 2; $i < count($lines); $i++) {
            $line = explode(':', $lines[$i]);
            $interfaces[] = trim($line[0]);
        }
        return $interfaces;

    }

    public function testmail()
    {

        $smtp = $this->input->post('smtp_ip_id', TRUE);
        $port = $this->input->post('smtp_port_id', TRUE);
        $encrypt = $this->input->post('smtp_encrypt', TRUE);
        $user = $this->input->post('smtp_user', TRUE);
        $pass = $this->input->post('smtp_pass', TRUE);
        $target = $this->input->post('test_mail', TRUE);

        $test_config = array(
            'protocol' => 'smtp',
            'smtp_host' => $smtp,
            'smtp_port_id' => $port,
            'smtp_crypto' => $encrypt,
            'smtp_user' => $user,
            'smtp_pass' => $pass,
            'mailtype' => 'html',
            'charset' => 'iso-8859-1',
            'wordwrap' => TRUE
        );

        $this->load->library('email');
        $this->email->initialize($test_config);

        $this->email->set_newline("\r\n");
        $this->email->from('telepath@hybridsec.com');
        $this->email->to($target);
        $this->email->subject('Telepath test mail');
        $this->email->set_mailtype("html");
        $this->email->message('Telepath test mail');

        if ($this->email->send()) {
            return_success();
        } else {
            return_fail($this->email->print_debugger());
        }

    }

    public function get_config()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $ans = $this->M_Config->get();

        //move data from sql to elasticsearch
//        $this->M_Config->insert_to_config();

        unset($ans['license_key_id']);
        unset($ans['license_mode_id']);

        $ans['interfaces'] = $this->_interfaces();
        $ans['agents'] = $this->M_Config->get_agents();
        $ans['regex'] = $this->M_Config->get_regex();
        $ans['whitelist'] = $this->M_Config->whitelist_get_ips();
        $ans['ip_balances'] = $this->M_Config->get_ip_balances();
        $ans['header_balances'] = $this->M_Config->get_header_balances();

        xss_return_success($ans);

    }


    // Execute Python -- Delete
    public function set_to_training_delete()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        exec('/opt/telepath/bin/delete_all_data.py');
        return_json(array('success' => true));
    }

    // Execute Python -- Backup
    public function set_to_training_backup()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        exec('/opt/telepath/bin/make_backup_and_delete_all_data.py');
        return_json(array('success' => true));
    }

    public function get_scheduler()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        xss_return_success(array('scheduler' => $this->M_Config->get_scheduler()));


    }


    public function set_schedule()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $mode = $this->input->post('mode', true);
    }

    public function set_config()
    {

        telepath_auth(__CLASS__, __FUNCTION__, $this);

        $config = $this->input->post(NULL, true);




        // Handle White list

        if (isset($config['whitelist'])) {

            $whitelist = $config['whitelist'];
            usort($whitelist, 'compare_from');
        }
        else{
            $whitelist=  [];
        }

        // check for white list changes
        if ($this->M_Config->whitelist_get_ips() != $whitelist) {

            // update ip format white list
            $this->M_Config->whitelist_set_ips($whitelist);

            $cidr = '';

            // Convert white list from ip format to CIDR and create string for BPF filter
            if (!empty($whitelist)) {

                $cidr = 'and not (net ';

                foreach ($whitelist as $ip_range) {

                    if (!is_ipaddr($ip_range['from'])) {
                        continue;
                    }

                    if (!is_ipaddr($ip_range['to'])) {
                        continue;
                    }

                    if (ip_less_than($ip_range['to'], $ip_range['from'])) {
                        continue;
                    }

                    $cidr .= implode(' or net ', ip_range_to_subnet_array($ip_range['from'], $ip_range['to']))
                        . ' or net ';

                }

                $cidr = substr($cidr, 0, -8) . ')';

            }

            // Save BPF filter string
            $this->M_Config->whitelist_set_cidr($cidr);

            $this->M_Config->agents_changed();

            // Reload suricata
            //exec('sudo telepath suricata 2>&1', $outpout);
        }


        if (isset($config['scheduler'])) {

            $scheduler = $config['scheduler'];


        } else {

            $scheduler  = [];
        }
        $this->M_Config->set_scheduler($scheduler);



        if (isset($config['ip_balances'])) {

            $ip_balances = $config['ip_balances'];
            usort($ip_balances, 'compare_from');

        }
        else{

            $ip_balances = [];

        }


        if (isset($config['header_balances'])) {

            $header_balances = $config['header_balances'];

        }
        else{

            $header_balances=[];

        }

        $old_config = $this->M_Config->get();

        // Check for changes in load balancer settings to update the elastic flag
        $this->M_Config->extension_changed( $this->M_Config->get_ip_balances() != $ip_balances ||
            $this->M_Config->get_header_balances() != $header_balances || $old_config['loadbalancer_mode_id'] ||
            $config['loadbalancer_mode_id']);

        $this->M_Config->set_ip_balances($ip_balances);

        $this->M_Config->set_header_balances($header_balances);



        // Check for proxy settings changes to update the elastic flag
        $this->M_Config->proxy_changed($old_config['proxy_mode_id'] != $config['proxy_mode_id'] || $old_config['proxy_ip_id'] !=
            $config['proxy_ip_id'] || $old_config['proxy_port_id'] != $config['proxy_port_id']);


        // Check for 'all_alerts_to_syslog_id' toggle change to update all the rule syslog elastic fields
        if ($old_config['all_alerts_to_syslog_id'] != $config['all_alerts_to_syslog_id']) {
            $this->load->model('M_Rules');
            $this->M_Rules->update_rule_syslog(intval($config['all_alerts_to_syslog_id']));
        }



        $params = [];

        foreach ($config as $key => $value) {

            switch ($key) {

                case 'operation_mode_id':
                case 'sniffer_mode_id':
                case 'engine_mode_id':
                case 'reverse_proxy_mode_id':
                case 'eta_id':
                case 'loadbalancer_mode_id':
                case 'smtp_port_id':
                case 'smtp_ip_id':
                case 'smtp_encrypt':
                case 'move_to_production_id':
                case 'proxy_ip_id':
                case 'rep_user_id':
                case 'proxy_port_id':
                case 'syslog_ip_id':
                case 'syslog_port_id':
                case 'syslog_protocol_id':
                case 'syslog_delimiter_id':
                case 'write_to_syslog_id':
                case 'all_alerts_to_syslog_id':
                case 'add_unknown_applications_id':
                case 'proxy_mode_id':
                case 'rep_pass_id':

                $params['body'][] = [
                    'update' => [
                        '_index' => 'telepath-config',
                        '_type' => 'config',
                        '_id' => $key
                    ]
                ];

                $params['body'][] = [
                    'doc' => ['value' => $value]
                ];

                    break;
            }
        }

        $this->elasticClient->bulk($params);



        if (!isset($config['regex']['URL'])){
            $config['regex']['URL'] = [];
        }
        // Check for changes in extensions settings
        $this->M_Config->extension_changed( $this->M_Config->get_regex() != $config['regex']['URL']);

        // set ignore extensions, Yuli
        $regex = $this->M_Config->set_regex($config['regex']['URL']);
        //var_dump($regex);


        if (!isset($config['agents'])) {
            $config['agents'] = [];
        }
        // Check for changes in network interfaces settings
        if ($this->M_Config->get_agents() != $config['agents']) {
            $this->M_Config->set_agents($config['agents']);
            $this->M_Config->agents_changed();
            $this->M_Config->redis_flag_push();
        }





        // Done, return updated config
        return $this->get_config();


    }

    // TODO: make www-data user sudoer for these commands in configure.sh:443
    public function do_upload()
    {
        @set_time_limit(-1);
        ini_set('memory_limit', '1300M');

        $base_target_file = FCPATH . 'upload/';
        $target_file = $base_target_file . basename($_FILES["file"]["name"]);
//        $uploadOk = 1;
//        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
        // Check if image file is a actual image or fake image
        /*       if (isset($_POST["submit"])) {
                   $check = getimagesize($_FILES["file"]["tmp_name"]);
                   if ($check !== false) {
                       echo "File is an image - " . $check["mime"] . ".";
                       $uploadOk = 1;
                   } else {
                       echo "File is not an image.";
                       $uploadOk = 0;
                   }
               }
       // Check if file already exists
               if (file_exists($target_file)) {
                   echo "Sorry, file already exists.";
                   $uploadOk = 0;
               }
       // Check file size
               if ($_FILES["fileToUpload"]["size"] > 500000) {
                   echo "Sorry, your file is too large.";
                   $uploadOk = 0;
               }
       // Allow certain file formats
               if ($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg"
                   && $imageFileType != "gif"
               ) {
                   echo "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
                   $uploadOk = 0;
               }
       // Check if $uploadOk is set to 0 by an error
               if ($uploadOk == 0) {
                   echo "Sorry, your file was not uploaded.";
       // if everything is ok, try to upload file
               } else {*/

        if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
            if (exec('sudo head -n1 ' . $target_file . ' | tcpdump -r -') != "tcpdump: unknown file format") {
                xss_return_success(['loader_mode' => $this->M_Config->check_file_loader_mode()]);
            }
        } else {
            return_fail("An error occurred");
        }

    }


    public function upload_to_db()
    {
        if (!$this->M_Config->check_file_loader_mode()) {
            exec('sudo telepath -r ' . FCPATH . 'upload  > /dev/null &');
            return_success();
        }
        return_fail();
    }

    public function delete_file()
    {
        $file_name = $this->input->post('file_name', TRUE);
        $file_path = FCPATH . 'upload/' . $file_name;
        if (file_exists($file_path) && unlink($file_path)) {
            return_success();
        } else {
            return_fail();
        }

    }
    public function empty_folder()
    {
        exec(' rm ' . FCPATH . 'upload/*');
    }







}
