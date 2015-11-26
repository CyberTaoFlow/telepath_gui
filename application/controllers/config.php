<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Config extends Tele_Controller {
	
	function __construct()
	{
		parent::__construct();
	}
	
	public function _interfaces() {

		$lines = file('c:/dev');
		$interfaces = array();
		for ($i = 2; $i < count($lines);  $i++) {
			$line = explode(':', $lines[$i]);
			$interfaces[] = trim($line[0]);
		}
		return $interfaces;
		
	}
	
	public function testmail() {
		
		$smtp   = $this->input->post('smtp', TRUE);
		$port   = $this->input->post('smtp_port', TRUE);
		$user   = $this->input->post('smtp_user', TRUE);
		$pass   = $this->input->post('smtp_pass', TRUE);
		$target = $this->input->post('test_mail', TRUE);
	
		$test_config =  array(
		  'protocol' => 'sendmail',
		  'smtp_host' => $smtp,
		  'smtp_port' => $port,
		  'smtp_user' => $user,
		  'smtp_pass' => $pass,
		  'mailtype' => 'html',
		  'charset' => 'iso-8859-1',
		  'wordwrap' => TRUE
		);
				
		$config['mailtype'] = 'html';
		$this->load->library('email', $test_config);
		$this->email->set_newline("\r\n");
		$this->email->from('telepath@hybridsec.com'); // change it to yours
		$this->email->to($target);// change it to yours
		$this->email->subject('Telepath test mail');
		$this->email->set_mailtype("html");
		$this->email->message('Telepath test mail');
		
		if($this->email->send()) {
			return_success();
		} else {
			return_fail($this->email->print_debugger());
		}
		
	}
			
	public function get_config() {
	
		telepath_auth(__CLASS__, __FUNCTION__, $this);
	
		$this->load->model('M_Config');
		
		$ans = $this->M_Config->get();
		
		$ans['interfaces']        = $this->_interfaces();
		$ans['agents'] 			  = $this->M_Config->get_agents();
		$ans['regex'] 			  = $this->M_Config->get_regex();
		$ans['whitelist']		  = $this->M_Config->whitelist_get_ips();
		$ans['success']			  = true;
			
		return_json($ans);

	}
	
	// Execute Python -- Delete
	public function set_to_training_delete() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
	
		exec('/opt/telepath/bin/delete_all_data.py');
		return_json(array('success' => true));
	}
	// Execute Python -- Backup
	public function set_to_training_backup() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
	
		exec('/opt/telepath/bin/make_backup_and_delete_all_data.py');
		return_json(array('success' => true));
	}
			
	public function get_scheduler() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
		
		$this->load->model('M_Config');
	
		$mode = $this->input->post('mode', true);
		
		$table = false;
		
		// Little mapping (TODO:: undo mapping)
		
		if($mode == 'get_schedule') 	   { $table = 'scheduler';		  }
		if($mode == 'get_report_schedule') { $table = 'report_scheduler'; }
		
		if($table) {
			return_json(array('scheduler' => $this->M_Config->get_scheduler($table), 'success' => true));
		}

	}

	public function add_scheduler_event() {
		telepath_auth(__CLASS__, __FUNCTION__, $this);
	
		$this->load->model('M_Config');
		
		$mode = $this->input->post('mode', true);
		$event = $this->input->post('event');
		$table = false;
		if($mode == 'get_schedule')        { $table = 'scheduler';                }
		if($mode == 'get_report_schedule') { $table = 'report_scheduler'; }
		if($table) {
			return_json(array('scheduler' => $this->M_Config->add_scheduler_event($table, $event), 'success' => true));
		}
	}	

        public function del_scheduler_event() {
                telepath_auth(__CLASS__, __FUNCTION__, $this);

                $this->load->model('M_Config');

                $mode = $this->input->post('mode', true);
                $event = $this->input->post('event');
                $table = false;
                if($mode == 'get_schedule')        { $table = 'scheduler';                }
                if($mode == 'get_report_schedule') { $table = 'report_scheduler'; }
                if($table) {
                        return_json(array('scheduler' => $this->M_Config->add_scheduler_event($table, $event, 0), 'success' => true));
                }
        }


	public function set_scheduler() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
		
		$this->load->model('M_Config');
	
		$mode = $this->input->post('mode', true);
		$data = $this->input->post('data', true);
		
		$table = false;
		
		// Little mapping (TODO:: undo mapping)
		
		if($mode == 'get_schedule') 	   { $table = 'scheduler';		  }
		if($mode == 'get_report_schedule') { $table = 'report_scheduler'; }
		
		if($table) {
			return_json($this->M_Config->set_scheduler($table, $data));
		}
	
	}
	
	public function set_schedule() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
	
		$mode = $this->input->post('mode', true);
	}
	
	public function get_num_of_studied() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
		
		$this->load->model('ConfigModel');
		$count = $this->ConfigModel->get_learning_so_far();
		return_json(array('success' => true, 'items' => $count));
		
	}


	public function set_config() {
		
		telepath_auth(__CLASS__, __FUNCTION__, $this);
		
		$this->load->model('M_Config');
			
		$config = $this->input->post(NULL, true);
		
		// Handle White list
		
		if(isset($config['whitelist'])) {

			$this->M_Config->whitelist_set_ips($config['whitelist']);
		
//			#$whitelist_new = explode(',', $config['ip_whitelist']);
//			$whitelist_new = $config['whitelist'];
//			$whitelist_old = $this->M_Config->whitelist_get_ips();
//			$whitelist_del = array_diff_assoc($whitelist_old, $whitelist_new);
//			$whitelist_add = array_diff_assoc($whitelist_new, $whitelist_old);
//
//			foreach($whitelist_del as $ip) {
//				$this->M_Config->whitelist_delete_ip($ip);
//			}
//			foreach($whitelist_add as $ip) {
//				$this->M_Config->whitelist_add_ip($ip);
//			}
			
		}

		foreach($config as $key => $value) {
		
			switch($key) {
			
				// Operation mode
				case 'input_mode':
				case 'operation_mode':
				case 'moveToProductionAfter':
				// SMTP Config
				case 'rep_user':
				case 'rep_pass':
				case 'smtp':
				case 'smtp_port':
				case 'write_to_syslog':
				case 'remote_syslog_ip':
				// Proxy Config
				case 'proxy_flag':
				case 'proxy_ip':
				case 'proxy_port':
				case 'load_balancer_on':
				case 'load_balancer_ip':
				case 'load_balancer_header':
				case 'addUnknownApp':
				// serive enable / disable
					$this->M_Config->update($key, $value);
					break;

				case 'engine_mode':
				case 'sniffer_mode':
				case 'reverse_proxy_mode':
					$this->M_Config->update($key, $value);
					// we need to restart telepath here (Yuli)
					break;
								
			}
		
		}
		// set ignore extensions, Yuli
		$this->M_Config->set_regex($config['regex']['URL']);	
		/*
		$config_path     = '/opt/telepath/conf/telepath.json';
		$old_config_data = file_get_contents($config_path);
		$new_config_data = json_encode([ 'ext' => (isset($config['regex']['URL']) ? $config['regex']['URL'] : ''), 'interfaces' => (isset($config['agents']) ? $config['agents'] : []) ]);
		if($new_config_data != $old_config_data) {
			file_put_contents($config_path, $new_config_data);
			// This causes suricata and nginx to reload
		}*/	
		
		if(isset($config['agents'])) {
			
//			$old_data = $this->M_Config->get_agents();
//			$tmp_old = '';
//			$tmp_new = '';
//
//			if(!empty($old_data)) {
//				foreach($old_data as $agent) {
//					$tmp_old .= $agent->NetworkInterface . $agent->FilterExpression;
//				}
//			}
//
//			if(!empty($config['agents'])) {
//				foreach($config['agents'] as $agent) {
//					$tmp_new .= $agent['NetworkInterface'] . $agent['FilterExpression'];
//				}
//			}
//
//			if($tmp_old != $tmp_new) {
//				$this->M_Config->set_agents($config['agents']);
//				$this->M_Config->update('agents_list_was_changed', 1);
//				system('/opt/telepath/suricata/af-packet.sh &');
//			}
			$this->M_Config->set_agents($config['agents']);

		}
		
		$this->M_Config->update('application_list_was_changed', 1);
		
		// Done, return updated config
		return $this->get_config();
	
	}
	
}
