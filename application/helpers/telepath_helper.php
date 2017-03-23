<?php
	
	function cmp_name($a, $b) {
		return strcasecmp (strtolower($a["name"]), strtolower($b["name"]));
	}
	
	function append_application_query($base, $apps) {
	
		if (empty($apps))
		{
			return $base;
		}
	
		if(count($apps) == 0) {
			return $base;
		}
		
		$base['body']['query']['bool']['filter'][] = [ "terms" => [ "host" => $apps ] ];

		return $base;
		
	}

function append_range_query($base, $range)
{

	if (!empty($range) && $range['state'] != 'data') {
		if ($range['state'] == 'range') {
			$base['body']['query']['bool']['filter'][] = [
				'range' => [
					'ts' => ['gte' => $range['start'], 'lte' => $range['end']]
				]
			];
		} else {
			$base['body']['query']['bool']['filter'][] = [
				'range' => [
					'ts' => ['gte' => $range['start']]
				]
			];
		}

	}

	return $base;

}

	function append_access_query($base, $debug = false) {
		

	
		$context = &get_instance();

		// Admins == unlimited
		if(is_cli() || $context->ion_auth->is_admin() ) {
			return $base;
		}
		
		$apps   = $context->acl->allowed_apps;
		$ranges = $context->acl->allowed_ranges;
		
		// Not defined == unlimited
		if(empty($apps) && empty($ranges)) {
			return $base;
		}
				
		$limit_conditions = array();
		
		if(isset($base['body']) && isset($base['body']['query']) && isset($base['body']['query']['bool'])) {
				
			// Applications
			if(!empty($apps)) {
				
				foreach($apps as $app) {
					$limit_conditions[] = [ "term" => [ "host" =>  $app ] ];
				}
			
			}
			
			// Single or Range of IP
			if(!empty($ranges)) {
				
				foreach($ranges as $range) {
				
					if(strpos($range, '-') !== false) {
						
						// IP Range
						
						$range = explode('-', $range);
						$limit_conditions[] = [ "range" => [ "ip_resp" => [ "gte" => $range[0], "lte" => $range[1] ] ] ];
						
						
					
					} else {
						
						// Single address
						
						$limit_conditions[] = [ "term" => [ "ip_resp" => $range ] ];
											
					
					}
				
				}
			
			}
			
			if(!empty($limit_conditions)) {
				$base['body']['query']['bool']['should'] = $limit_conditions;
				$base['body']['query']['bool']['minimum_should_match'] = 1;
			}
			
			
			
		}
		return $base;
		
		
	}
	
	function get_elastic_results($results) {
		$result  = array();
		if(!empty($results) && isset($results['hits']) && isset($results['hits']['hits'])) {
			foreach($results['hits']['hits'] as $row) {
				$new_row  = $row['_source'];
				if(isset($row['_id'])) { $new_row['uid'] = $row['_id']; }
				if(isset($row['_score']) && !isset($new_row['score'])) { $new_row['score'] = $row['_score']; }
				if(isset($row['_index'])) { $new_row['index'] = $row['_index']; }
				if(isset($row['_type'])) { $new_row['type'] = $row['_type']; }
				$result[] = $new_row;
			}
		}		
		return $result;
	}

function get_source_and_ip($results) {
	$result  = array();
	if(!empty($results) && isset($results['hits']) && isset($results['hits']['hits'])) {
		foreach($results['hits']['hits'] as $row) {
			$new_row  = $row['_source'];
			if(isset($row['_id'])) { $new_row['uid'] = $row['_id']; }
			$result[] = $new_row;
		}
	}
	return $result;
}

# Fix the problem we have with sort. When sorting alerts by date we get other requests with the same session id. As a
# result we need to perform a second sort.
function sort_by_date($results, $dir)
{
	if ($dir == 'ASC') {
		$dir = SORT_ASC;
	} elseif ($dir == 'DESC') {
		$dir = SORT_DESC;
	}

	$temp = [];
	foreach ($results as $key => $row) {
		$temp[$key] = $row['date'];
	}

	array_multisort($temp, $dir, $results);

	return $results;

}

function delete_by_query($client, $params, $max = 0)
{
	#$results = $this->elasticClient->deleteByQuery($params);
	$results   = get_elastic_results($client->search($params));
	if (!$results)
	{
		return;
	}
	if (count($results) == 1 or $max == 1)
	{
                foreach ($results as $res){
                        $params=[];
                        $params['index'] = $res['index'];
                        $params['type'] = $res['type'];
                        $params['id']=$res['uid'];
                        $client->delete($params);
			return;
                }
		return;
        }
	foreach ($results as $res){
		$params=[];
		$params['index'] = $res['index'];
		$params['type'] = $res['type'];
		$params['id']=$res['uid'];
		$client->delete($params);
	}
}

/**
 * @param $client : the elastic
 * @param $params
 * @param int $max
 */
function new_delete_by_query($client, $params)
{

	$limit = true;
	if (!isset($params['body']['size'])){
		$params['body']['size'] = 9999;
		$limit = false;
	}

	while (true) {

		$results = $client->search($params);

		if (!empty($results) && isset($results['hits']) && !empty($results['hits']['hits'])) {

			$params2 = [];
			foreach ($results['hits']['hits'] as $result) {

				$params2['body'][] = [
					'delete' => [
						'_index' => $result['_index'],
						'_type' => $result['_type'],
						'_id' => $result['_id']
					]
				];
			}
			$params2['refresh'] = '';
			$client->bulk($params2);

			if ($limit) {
				return;
			}
		} else {
			return;
		}
	}
}


/**
 * @param $client: the elastic client
 * @param $params: parameter query
 * @param $update: the update value
 * @param $influence: boolean. If the updated value influence the query (example: change location of US citizens to
 * 	Canada, the parameter is true. But change work group of US citizens, the parameter is false).
 */
function update_by_query($client, $params, $update, $influence = false)
{
	$from = 0;
	$limit = true;

	if (!isset($params['body']['size'])){
		$params['body']['size'] = 9999;
		$limit = false;
	}

	while (true) {

		$params['body']['from'] = $from;
		$results = $client->search($params);

		if (!$results || count($results['hits']['hits']) == 0) {
			return;
		}

		if (!$influence){
			$from += count($results['hits']['hits']);
		}

		$params2 = [];
		foreach ($results['hits']['hits'] as $result) {

			$params2['body'][] = [
				'update' => [
					'_index' => $result['_index'],
					'_type' => $result['_type'],
					'_id' => $result['_id']
				]
			];
			$params2['body'][] = [
				'doc' => $update
			];
		}
		$params2['refresh'] = '';
		$client->bulk($params2);

		if($limit){
			return;
		}
	}
}


function prepare_elastic_results($results) {
	$result  = array();
	if(!empty($results) && isset($results['hits']) && isset($results['hits']['hits'])) {
		foreach($results['hits']['hits'] as $row) {
			$result[] = $row['fields']['_src'][0];
		}
	}
	return $result;
}


// retrieve only the _source field
function get_app_source($results,$learning_so_far=false)
{
	$result = array();
	if (!empty($results) && isset($results['hits']) && isset($results['hits']['hits'])) {
		foreach ($results['hits']['hits'] as $row) {
			// if the string was found in subdomains, we set the open parameter to true, to display the subdomains in the GUI
			if (isset ($row['_source']['subdomains']) && !empty ($row['_source']['subdomains']) && isset ($row['highlight']['subdomains'])) {
				$row['_source']['open'] = true;
			}
			if($learning_so_far and isset($row['_source']['learning_so_far'])){
				$row['_source']['learning_so_far']=thousandsCurrencyFormat($row['_source']['learning_so_far']);
			}

			$result[] = $row['_source'];
		}
	}
	return $result;
}

// retrieve only the _source field
function get_source($results)
{
	$result = array();
	if (!empty($results) && isset($results['hits']) && isset($results['hits']['hits'])) {
		foreach ($results['hits']['hits'] as $row) {
			$result[] = $row['_source'];
		}
	}
	return $result;
}


function get_gap($range) {
	
		$difference	= $range['end'] - $range['start'];

		if ($difference>=0 & $difference<=60*60)
			return 'minutesToHour';
		else if ($difference>60*60 && $difference<=60*60*24)	
			return 'hoursToDay';
		else if ($difference>60*60*24 && $difference<=60*60*24*7)	
			return 'dayToWeek';
		else if($difference>60*60*24*7 && $difference<=60*60*24*30)
			return 'weekToMonth';
		else if($difference>60*60*24*30 && $difference<=60*60*24*365/2)
			return 'monthTo6months';
		else if($difference>60*60*24*30 && $difference<=60*60*24*365)
			return '6monthsToYear';
		else if ($difference>60*60*24*365)
			return 'aYearPlus';	
		
	}
	
	function get_smtp_config($ci_instance = false) {
		
		/*if(!$ci_instance) { $ci_instance = &get_instance(); }
		$ci_instance->load->model('ConfigModel');
		$config = $ci_instance->ConfigModel->get();

		return array(
		  'protocol' => 'smtp_ip_id',
		  'smtp_host' => $config['smtp_ip_id'],
		  'smtp_port_id' => $config['smtp_port_id'],
		  'smtp_user' => $config['rep_user_id'],
		  'smtp_pass' => $config['rep_pass_id'],
		  'mailtype' => 'html',
		  'charset' => 'iso-8859-1',
		  'wordwrap' => TRUE
		);*/
		
		return array();

	}
	
	function telepath_log($class, $function, $context, $request) {


        
		// LOG Request
		$logfile = $context->config->item('telepath_ui_log');
		$log     = array('timestamp' => time() ,
						 'userdata' => $context->session->userdata(),
						 'class' => $class, 
						 'function' => $function, 
						 'request' => $request
						);
						
		file_put_contents($logfile, json_encode($log) . "\n" , FILE_APPEND);
	
	}
	
	function telepath_auth($class, $function, $context = false) {
		
		if(!$context) { $context = &get_instance(); }
		
		// Initialize access list.
		if(!is_cli()){
		$context->acl->init_current_acl();
		
		telepath_log($class, $function, $context, $_REQUEST);
		
		// Rewrites (caution)
		
		$rewrite_list = array(
//		Dashboard

			// Engine Status/Start/Stop == Get / Set Telepath
			array('from_class' => 'Dashboard', 'from_function' => 'index', 'to_class' => 'Dashboard', 'to_function' => 'get_dashboard'),
			array('from_class' => 'Cases', 'from_function' => 'index', 'to_class' => 'Cases', 'to_function' => 'get_cases'),
			array('from_class' => 'Suspects', 'from_function' => 'index', 'to_class' => 'Suspects', 'to_function' => 'get_suspects'),
			array('from_class' => 'Alerts', 'from_function' => 'index', 'to_class' => 'Alerts', 'to_function' => 'get_alerts'),

			// Basic user functions for viewing and updating self user info == Get Telepath
			array('from_class' => 'Users', 'from_function' => 'get_self', 'to_class' => 'Telepath', 'to_function' => 'get_telepath'),
			array('from_class' => 'Users', 'from_function' => 'set_self', 'to_class' => 'Telepath', 'to_function' => 'get_telepath'),
			
		);

		if ($class=='Search'){
			$function='get';
		}
		
		foreach($rewrite_list as $rewrite_item) {
			if($class == $rewrite_item['from_class'] && $function == $rewrite_item['from_function']) {
				$class    = $rewrite_item['to_class'];
				$function = $rewrite_item['to_function'];
			}
		}

		}
		
		// END Rewrites
		
		// Validate
		
		if($class == 'Telepath' && $function == 'index') {

			// telepath_get:: validation is within index.php view file
		
		} else {
		
			// Passthru if Admin
			
			if(!is_cli() && !$context->ion_auth->is_admin()) {
				
				// Fail if not logged in.
				if(!$context->ion_auth->logged_in()) {
					return_json(array('success' => false, 'logout' => true, 'error' => 'Not logged in.'));
				}
				
				// Initialize access list.
				$context->acl->init_current_acl();
				
				// Assume fail.
				$allowed = false;
				
				// Convention for CRUD access model (later shortened into get / set)
				$function_split = explode('_', $function);
				if($function_split[0] == 'del' || $function_split[0] == 'add') {
					$function_split[0] == 'set';
				}
				$short_array    = array('get', 'set', 'del', 'add');
				
				if(in_array($function_split[0], $short_array)) {
					$allowed = $context->acl->has_perm($class, $function_split[0]); // Check CRUD
				} else {
					$allowed = $context->acl->has_perm($class, $function); // Check Full Notation
				}
				
				// Fail
				if($allowed) {
					return true;
				}

				else{
					return_json(array('success' => false, 'error' =>'you d`ont have permission to see '.$class, 'debug' => 'Auth declined access for ' . $class . ' function ' . $function));
				}
			}

		
		}
		
	}
	
	function return_json($array) {
		
		//function jsonRemoveUnicodeSequences($struct) {
		//	return preg_replace("/\\\\u([a-f0-9]{4})/e", "iconv('UCS-4LE','UTF-8',pack('V', hexdec('U$1')))", json_encode($struct));
		//}

		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($array);
		die;
		
	}

	function return_success($items = array()) {
		return_json(array('success' => true, 'items' => $items, 'total' => count($items), 'ip' => $_SERVER['REMOTE_ADDR']));
	}

	function xss_return_success($items = array()) {
		// Prevent XSS
		array_walk_recursive($items, function (&$value) {
			$value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8', false);
		});
		return_json(array('success' => true, 'items' => $items, 'total' => count($items), 'ip' => $_SERVER['REMOTE_ADDR']));
	}
	function return_fail($error_msg = '') {
		return_json(array('success' => false, 'items' => array(), 'total' => 0, 'error' => $error_msg));
	}

	function extract_page_name($name) {
			return $name == '/' ? '/' : end(explode('/',$name));
	}
	
	function bin2text($bin_str) {
	
		$text_str = '';
		$chars = EXPLODE("\n", CHUNK_SPLIT(STR_REPLACE("\n", '', $bin_str), 8));
		$_I = COUNT($chars);
		FOR($i = 0; $i < $_I; $text_str .= CHR(BINDEC($chars[$i])), $i);
		RETURN $text_str;
		
	}

    function logger($message, $file_path = false)
    {
        if (!is_cli())
            return;

        if ($file_path) {
            file_put_contents($file_path, '');
        }

        echo date('Y-m-d H:i') . ' ' . $message . "\n";
    }

	function thousandsCurrencyFormat($num)
	{
		$x = round($num);
		$x_number_format = number_format($x);
		$x_array = explode(',', $x_number_format);
		$x_parts = array('K', 'M', 'B', 'T');
		$x_count_parts = count($x_array) - 1;
		$x_display = $x_array[0];
		if($x_count_parts>0) {
			$x_display .= ((int)$x_array[1][0] !== 0 ? '.' . $x_array[1][0] : '');
			$x_display .= $x_parts[$x_count_parts - 1];
		}
		return $x_display;
	}


function compare_from($a, $b)
{
	return strnatcmp($a['from'], $b['from']);
}

function extractRootDomain($url)
{
	require FCPATH .'vendor/tldextractphp/tldextract.php';

	$components = tldextract($url);
	$root_domain =  $components->domain;
	// add suffix if exists
	if ($suffix = $components->tld) {
		$root_domain .= '.' . $suffix;
	}
	return $root_domain;
}

// The bulk of the following code is from /etc/inc/util.inc in pfSense v2.0.2
// See https://www.pfsense.org - seriously good open source router software

// NOTE: formatting uses 3-space tabs

/* Convert IP address to long int, truncated to 32-bits to avoid sign extension
on 64-bit platforms. */
function ip2long32($ip) {
	return ( ip2long($ip) & 0xFFFFFFFF );
}

/* Convert IP address to unsigned long int. */
function ip2ulong($ip) {
	return sprintf("%u", ip2long32($ip));
}

/* Convert long int to IP address, truncating to 32-bits. */
function long2ip32($ip) {
	return long2ip($ip & 0xFFFFFFFF);
}

/* returns true if $ipaddr is a valid dotted IPv4 address */
function is_ipaddr($ipaddr) {
	if (!is_string($ipaddr))
		return false;

	$ip_long = ip2long($ipaddr);
	$ip_reverse = long2ip32($ip_long);

	if ($ipaddr == $ip_reverse)
		return true;
	else
		return false;
}

/* Return true if the first IP is 'before' the second */
function ip_less_than($ip1, $ip2) {
	// Compare as unsigned long because otherwise it wouldn't work when
	// crossing over from 127.255.255.255 / 128.0.0.0 barrier
	return ip2ulong($ip1) < ip2ulong($ip2);
}

/* Return true if the first IP is 'after' the second */
function ip_greater_than($ip1, $ip2) {
	// Compare as unsigned long because otherwise it wouldn't work
	// when crossing over from 127.255.255.255 / 128.0.0.0 barrier
	return ip2ulong($ip1) > ip2ulong($ip2);
}

/* Return the next IP address after the given address */
function ip_after($ip) {
	return long2ip32(ip2long($ip)+1);
}

/* Find the smallest possible subnet mask which can contain a given number of IPs
*  e.g. 512 IPs can fit in a /23, but 513 IPs need a /22
*/
function find_smallest_cidr($number) {
	$smallest = 1;
	for ($b=32; $b > 0; $b--) {
		$smallest = ($number <= pow(2,$b)) ? $b : $smallest;
	}
	return (32-$smallest);
}

/* Find out how many IPs are contained within a given IP range
*  e.g. 192.168.0.0 to 192.168.0.255 returns 256
*/
function ip_range_size($startip, $endip) {
	if (is_ipaddr($startip) && is_ipaddr($endip)) {
		// Operate as unsigned long because otherwise it wouldn't work
		// when crossing over from 127.255.255.255 / 128.0.0.0 barrier
		return abs(ip2ulong($startip) - ip2ulong($endip)) + 1;
	}
	return -1;
}

/* return the subnet address given a host address and a subnet bit count */
function gen_subnet($ipaddr, $bits) {
	if (!is_ipaddr($ipaddr) || !is_numeric($bits))
		return "";

	return long2ip(ip2long($ipaddr) & gen_subnet_mask_long($bits));
}

/* returns a subnet mask (long given a bit count) */
function gen_subnet_mask_long($bits) {
	$sm = 0;
	for ($i = 0; $i < $bits; $i++) {
		$sm >>= 1;
		$sm |= 0x80000000;
	}
	return $sm;
}

/* return the highest (broadcast) address in the subnet given a host address and
a subnet bit count */
function gen_subnet_max($ipaddr, $bits) {
	if (!is_ipaddr($ipaddr) || !is_numeric($bits))
		return "";

	return long2ip32(ip2long($ipaddr) | ~gen_subnet_mask_long($bits));
}

/* Convert a range of IPs to an array of subnets which can contain the range. */
function ip_range_to_subnet_array($startip, $endip) {

	if (!is_ipaddr($startip) || !is_ipaddr($endip)) {
		return array();
	}

	// Container for subnets within this range.
	$rangesubnets = array();

	// Figure out what the smallest subnet is that holds the number of IPs in the
	// given range.
	$cidr = find_smallest_cidr(ip_range_size($startip, $endip));

	// Loop here to reduce subnet size and retest as needed. We need to make sure
	// that the target subnet is wholly contained between $startip and $endip.
	for ($cidr; $cidr <= 32; $cidr++) {
		// Find the network and broadcast addresses for the subnet being tested.
		$targetsub_min = gen_subnet($startip, $cidr);
		$targetsub_max = gen_subnet_max($startip, $cidr);

		// Check best case where the range is exactly one subnet.
		if (($targetsub_min == $startip) && ($targetsub_max == $endip)) {
			// Hooray, the range is exactly this subnet!
			return array("{$startip}/{$cidr}");
		}

		// These remaining scenarios will find a subnet that uses the largest
		// chunk possible of the range being tested, and leave the rest to be
		// tested recursively after the loop.

		// Check if the subnet begins with $startip and ends before $endip
		if (($targetsub_min == $startip) &&
			ip_less_than($targetsub_max, $endip)) {
			break;
		}

		// Check if the subnet ends at $endip and starts after $startip
		if (ip_greater_than($targetsub_min, $startip) &&
			($targetsub_max == $endip)) {
			break;
		}

		// Check if the subnet is between $startip and $endip
		if (ip_greater_than($targetsub_min, $startip) &&
			ip_less_than($targetsub_max, $endip)) {
			break;
		}
	}

	// Some logic that will recursivly search from $startip to the first IP before
	// the start of the subnet we just found.
	// NOTE: This may never be hit, the way the above algo turned out, but is left
	// for completeness.
	if ($startip != $targetsub_min) {
		$rangesubnets =
			array_merge($rangesubnets,
				ip_range_to_subnet_array($startip,
					ip_before($targetsub_min)));
	}

	// Add in the subnet we found before, to preserve ordering
	$rangesubnets[] = "{$targetsub_min}/{$cidr}";

	// And some more logic that will search after the subnet we found to fill in
	// to the end of the range.
	if ($endip != $targetsub_max) {
		$rangesubnets =
			array_merge($rangesubnets,
				ip_range_to_subnet_array(ip_after($targetsub_max), $endip));
	}

	return $rangesubnets;
}










	
?>
