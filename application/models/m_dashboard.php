<?php
	
class M_Dashboard extends CI_Model {
	
	function __construct() {
		parent::__construct();
		
//		$params = array();
//		$params['hosts'] = array ('127.0.0.1:9200');
		
		$this->elasticClient = new Elasticsearch\Client();
	}
	
	
	
	public function get_alerts($range, $apps = array(), $sort = 'counter', $dir = 'ASC') {
	
		$this->load->model('M_Alerts');
		return $this->M_Alerts->get_alerts(false, false, $sort, $dir, 0, 5, false, $range, $apps);
		
	}
	
	public function get_cases($range, $apps = array()) {
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => array(
				'cases' => array(
					"terms" => array(
						"field" => "cases.name",
						"size" => 200
					),
					"aggs" => [
						"sid" => [ "cardinality" => [ "field" => "sid", "precision_threshold" => 200] ]
					]
				)				
			),
			'query' => array(
				'bool' => array(
					'must' => array(
						array(
							'range' => array(
							  'ts' => array(
								'gte' => intval($range['start']),
								'lte' => intval($range['end'])
							  )
							)
						)
					)
				)
			)
		);
		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		
		$results = $this->elasticClient->search($params);
		$ans = array();
		
		if(!empty($results) && isset($results['aggregations'])) {
			
			foreach($results['aggregations']['cases']['buckets'] as $bucket) {
				
				$this->load->model('M_Cases');
				$case_data = $this->M_Cases->get_case_data($bucket['key']);
				if ($case_data['empty'] == false)
				{
					$ans[] = array('name' => $bucket['key'], 'count' => $bucket['sid']['value'], 'checkable' => false, 'case_data' => $case_data);
				}
				
			}
			return $ans;
			
		} 
		
		return $ans;
		
	}
	
	public function get_gap_alerts($interval, $range, $apps = array()) {
		
		$result = array('case' => 0, 'noncase' => 0);
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => array(
				'sid' => array(
					"histogram" => [
						"field" => "ts",
						"interval" => $interval,
						"min_doc_count" => 0,
						"extended_bounds" => ["min"=>intval($range['start']),"max"=>intval($range['end'])]
					]
				)
			),
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
						[ 'range' => [ 'ts' => [ 'gte' => intval($range['start']), 'lte' => intval($range['end']) ] ] ],
						[ 'range' => [ 'alerts_count' => [ 'gte' => 1 ] ] ],
					]
				]
			]
		);
		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		
		$results   = $this->elasticClient->search($params);
		$data = array();
		if(!empty($results) && isset($results['aggregations']['sid']))
		{
			//$result['alerts'][]   = array($time['start'] * 1000, $this->get_gap_alerts($time, $apps));
			foreach ($results['aggregations']['sid']['buckets'] as $bucket)
			{
				$data[] = array($bucket['key'] * 1000, $bucket['doc_count']);
			}
			return $data;
		}
		
		return $data;
		
	}
	
	public function get_gap_cases($interval, $range, $apps = array()) {
		
		$result = array('case' => 0, 'noncase' => 0);
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => array(
				'sid' => array(
					"histogram" => [
						"field" => "ts",
						"interval" => $interval,
						"min_doc_count" => 0,
						"extended_bounds" => ["min"=>intval($range['start']),"max"=>intval($range['end'])]
					]
				)
			),
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
						[ 'range' => [ 'ts' => [ 'gte' => intval($range['start']), 'lte' => intval($range['end']) ] ] ],
						[ 'range' => [ 'cases_count' => [ 'gte' => 1 ] ] ],
					]
				]
			]
		);
		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		
		$results   = $this->elasticClient->search($params);
		$data = array();
		if(!empty($results) && isset($results['aggregations']['sid'])) {
			//$result['alerts'][]   = array($time['start'] * 1000, $this->get_gap_alerts($time, $apps));
			foreach ($results['aggregations']['sid']['buckets'] as $bucket)
			{
				$data[] = array($bucket['key'] * 1000, $bucket['doc_count']);
			}
			return $data;
		}
		
		return $data;
		
	}
	
	public function get_suspects($range, $apps = array(), $sort = 'counter', $dir = 'ASC', $limit = 5) {

		$this->load->model('M_Suspects');
		return $this->M_Suspects->get($range, $apps, $sort, $dir, 0, $limit);

	}
	
	// Dashboard Functionality
	function get_map($range, $apps, $map_mode) {
		
		$params['body'] = [
			'size'  => 0,
			'aggs'  => [
				'country_code' => [
					"terms" => [
						"field" => "country_code",
						"size" => 200
					],
				]
			],
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
						[ 'range' => [ 'ts' => [ 'gte' => intval($range['start']), 'lte' => intval($range['end']) ] ] ],
					]
				],
			],
		];
		
		if($map_mode== 'alerts') {
			$params['body']['query']['bool']['must'][] = [ 'range' => [ 'alerts_count' => [ 'gte' => 1 ] ] ];
		}
		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		
		$results = $this->elasticClient->search($params);
		//print_r($results);
		if(!empty($results) && isset($results['aggregations'])) {
			
			$ans = array();
			foreach($results['aggregations']['country_code']['buckets'] as $bucket) {
				$ans[$bucket['key']] = $bucket['doc_count']; // $bucket['ip_orig']['value']
			}
			return $ans;
			
		} 
		return array();
		
	}
	
	public function get_gap_sessions($interval, $range, $apps = array(), $suspects = false) {
		
		$result = array('case' => 0, 'noncase' => 0);
		
		$this->load->model('M_Suspects');
		$suspect_threshold = $this->M_Suspects->get_threshold();
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => array(
				'sid' => array(
					"histogram" => [
						"field" => "ts",
						"interval" => $interval,
						"min_doc_count" => 0,
						"extended_bounds" => ["min"=>intval($range['start']),"max"=>intval($range['end'])]
					]
				)
			),
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
						[ 'range' => [ 'ts' => [ 'gte' => intval($range['start']), 'lte' => intval($range['end']) ] ] ],
						[ 'range' => [ 'score_average' => [ ($suspects ? 'gte' : 'lt') => $suspect_threshold ] ] ]
					]
				]
			]
		);
		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		$results   = $this->elasticClient->search($params);
		$data = array();
		if(!empty($results) && isset($results['aggregations']['sid'])) {
			//$result['alerts'][]   = array($time['start'] * 1000, $this->get_gap_alerts($time, $apps));
			foreach ($results['aggregations']['sid']['buckets'] as $bucket)
			{
				$data[] = array($bucket['key'] * 1000, $bucket['doc_count']);
			}
			return $data;
		}
		
		return $data;
				
	}
	
	function get_chart($range, $apps) {

		$time = $this->getRanges($range, false, false);

		$result = array(
			'alerts'   => $this->get_gap_alerts($time, $range, $apps),
			'sessions' => $this->get_gap_sessions($time, $range, $apps),
			'cases'    => $this->get_gap_cases($time, $range, $apps),
			'suspects' => $this->get_gap_sessions($time, $range, $apps, true)
		);
		return $result;
	}
	
	public function getRanges($range, $gap, $scale) {

		$del = 30;
		$days = intval( ($range['end'] + 60 - $range['start']) / (60*60*24) );
		//var_dump("days $days");
		if ($days <= 7)
		{
			$del = 24;
		} else if ($days <= 31)
		{
			$del = $days;
		} else {
			$del = 30;
		}
		#var_dump("num $del, int: ". intval(($range['end'] - $range['start'] ) / $del));

		return intval(($range['end'] - $range['start'] ) / $del);

	}

	public function set_map_mode($status,$range){

		$this->user_id = $this->ion_auth->get_user_id();

		$parsed=array('time_range'=>$range,'status'=>$status);

		$this->ion_auth->update($this->user_id, array('extradata' => json_encode($parsed)));

	}

	public function get_map_mode($local=false)
	{
		$this->user_id = $this->ion_auth->get_user_id();

		if ($this->user_id) {
			$this->user = $this->ion_auth->user($this->user_id)->result();
			if (!isset($this->user[0])) {
				return;
			}
			$this->user = (array)$this->user[0];
		} else {
			return;
		}

		$parsed = $this->user['extradata'] != '' ? json_decode($this->user['extradata'], true) : false;


		$map_mode= $parsed['status'];

		if ($local)
			return $map_mode;

		return_success($map_mode);
	}
}

?>
