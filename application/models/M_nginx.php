<?php

class M_Nginx extends CI_Model {

	private $certs_dir;


	function __construct()
	{
		parent::__construct();
		// Connect elastic
		//$params = array('hosts' => array('127.0.0.1:9200'));
		$this->elasticClient = new Elasticsearch\Client();

		$this->load->model('M_Config');
		$this->certs_dir = $this->config->item('certs_dir');
		if (!file_exists($this->certs_dir)){
			exec('sudo mkdir -m 777 '.$this->certs_dir);
		}
	}

	function old_gen_config() {



//		$fields     = 'app_id,app_domain,app_ips,certificate,private_key,ssl_flag,ssl_server_port';
		
		$params['index']='telepath-domains';
		$params['type']='domains';
		$params['body'] = [
			'size'   => 10000
		];
		
		$apps_dirty = get_elastic_results($this->elasticClient->search($params));
		$apps_clean = array();
		
		
		
		
		// Wipe clean the current certificates directory
		array_map('unlink', glob($this->certs_dir . "*"));
		
		foreach($apps_dirty as $app) {
			
			// If our domain name is somehow empty, we cant proxy it
			if($app['host'] == '') {
				continue;
			}
			
			// Cant proxy application without destination IP
			if(!isset($app['app_ips']) || $app['app_ips'] == '') {
				continue;
			}
			
			// Double Check, Cant proxy application without destination IP
			$app_ips = explode(',', $app['app_ips']);
			if(count($app_ips) == 0 || (count($app_ips) == 1 && $app_ips[0] == '')) {
				continue;
			}
			
			// Copy back to array just the clean valid values
			$app['app_ips'] = [];
			foreach($app_ips as $ip) {
				if(filter_var($ip, FILTER_VALIDATE_IP)) {
					$app['app_ips'][] = $ip;
				}
			}
			
			// Just to make sure..
			if(count($app['app_ips']) == 0) {
				continue;
			}

			// If its SSL but we have no certificates, we can't proxy it
			if(intval($app['ssl_flag']) == 1 && ($app['app_ssl_certificate'] == '' || $app['app_ssl_private'] == '')) {
				continue;
			}
			
			// If its SSL but we have no port, default to 443
			if(intval($app['ssl_flag']) == 1 && (!isset($app['ssl_server_port']) || intval($app['ssl_server_port']) == 0)) {
				$app['ssl_server_port'] = '443';
			}
			
			// Attempt decoding certificates and store them into a directory
			if(intval($app['ssl_flag']) == 1) {
				
				$certificate  = $app['app_ssl_certificate']; //base64_decode($app['app_ssl_certificate'], true);
				$private_key  = $app['app_ssl_private']; //base64_decode($app['app_ssl_private'], true);
				
				// If decode failed, we can't proxy it...
				if(!$certificate || !$private_key) {
					continue;
				}
				
				// Save our certificates as files
				$key_file  = $this->certs_dir . 'application_' . md5($app['host']) . '_certificate.crt';
				$cert_file = $this->certs_dir . 'application_' . md5($app['host']) . '_private_key.key';
				
				file_put_contents($key_file,  $certificate);
				file_put_contents($cert_file, $private_key);
				
				// Validate write, under no circumstance we want nginx crashing due to bad config
				if(!file_exists($key_file) || !file_exists($cert_file)) {
					continue;
				}
				
			}
			
			// Cleanup the data array
			unset($app['app_ssl_certificate']);
			unset($app['app_ssl_private']);
			
			// All checks out, append to clean list
			$apps_clean[] = $app;
			
		}
		
		return $this->load->view('nginx', array('apps' => $apps_clean, 'certs_dir' => $this->certs_dir), true);
		
	}


	function gen_config()
	{

		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
		$params['body'] = [
			'size' => 10000
		];
		$params['timeout'] = $this->config->item('timeout');

		$apps_dirty = get_elastic_results($this->elasticClient->search($params));
		$apps_clean = array();

		foreach ($apps_dirty as $app) {

			// If our domain name is somehow empty, we cant proxy it
			if (empty($app['host']) ) {
				continue;
			}

			// Cant proxy application without destination IP
			if (empty($app['app_ips']) ) {
				continue;
			}

			// Double Check, Cant proxy application without destination IP
			$app_ips = explode(',', $app['app_ips']);
			if (count($app_ips) == 0 || (count($app_ips) == 1 && $app_ips[0] == '')) {
				continue;
			}

			// Copy back to array just the clean valid values
			$app['app_ips'] = [];
			foreach ($app_ips as $ip) {
				// Separate the string to IP and port
				$app_ip = explode(':', $ip);
				if (filter_var($app_ip[0], FILTER_VALIDATE_IP)) {
					$app['app_ips'][] = ['ip' => $app_ip[0], 'port' => (!empty($app_ip[1]) ? $app_ip[1] :  '80')];
				}
			}

			// Just to make sure..
			if (count($app['app_ips']) == 0) {
				continue;
			}

			// If its SSL but we have no certificates, we can't proxy it
			if (intval($app['ssl_flag']) == 1 && ($app['app_ssl_certificate'] == '' || $app['app_ssl_private'] == '')) {
				continue;
			}

			// If its SSL but we have no port, default to 443
			if (intval($app['ssl_flag']) == 1 && (empty($app['ssl_server_port']))) {
				$app['ssl_server_port'] = '443';
			}

			// Check certificates
			if (intval($app['ssl_flag']) == 1) {

				// Check our certificates files
				$key_file = $this->certs_dir . 'application_' . md5($app['host']) . '_certificate.crt';
				$cert_file = $this->certs_dir . 'application_' . md5($app['host']) . '_private_key.key';

				// Validate write, under no circumstance we want nginx crashing due to bad config
				if (!file_exists($key_file) || !file_exists($cert_file)) {
					continue;
				}

			}

			// Cleanup the data array
			unset($app['app_ssl_certificate']);
			unset($app['app_ssl_private']);

			// All checks out, append to clean list
			$apps_clean[] = $app;

		}

		return $this->load->view('nginx', array('apps' => $apps_clean, 'certs_dir' => $this->certs_dir), true);


	}


	function del_certs($host)
	{

		$key_file = $this->certs_dir . 'application_' . md5($host) . '_certificate.crt';
		$cert_file = $this->certs_dir . 'application_' . md5($host) . '_private_key.key';

		// Wipe clean the current certificates files
		if (file_exists($key_file)) unlink($key_file);
		if (file_exists($cert_file)) unlink($cert_file);

	}

	function create_certs($app)
	{

		$key_file = $this->certs_dir . 'application_' . md5($app['host']) . '_certificate.crt';
		$cert_file = $this->certs_dir . 'application_' . md5($app['host']) . '_private_key.key';

		// Wipe clean the current certificates files
		if (file_exists($key_file)) unlink($key_file);
		if (file_exists($cert_file)) unlink($cert_file);

		// Store certificates into a directory
		if (intval($app['ssl_flag']) == 1 && $app['app_ssl_certificate'] != '' && $app['app_ssl_private'] != '') {

			// Save our certificates as files
			$created1 = file_put_contents($key_file, $app['app_ssl_certificate']);
			$created2 = file_put_contents($cert_file, $app['app_ssl_private']);

			return ($created1 && $created2);

		}

		return false;

	}

}

?>
