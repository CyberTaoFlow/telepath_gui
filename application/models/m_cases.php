<?php

class M_Cases extends CI_Model {
	
	function __construct() {
		parent::__construct();
		
		// Connect elastic
		//$params = array('hosts' => array('127.0.0.1:9200'));
#$params['logging'] = true;
#$params['logPath'] = '/tmp/elasticsearch.log';
		$this->elasticClient = new Elasticsearch\Client();
	}

	public function get_case_data($cid) {
		
		$params['index'] = 'telepath-config';	
		$params['body'] = [
			'size' => 100,
			'query' => [ 'term' => [ '_type' => 'cases' ] ]
		];
		
		$result = get_elastic_results($this->elasticClient->search($params));

		$results = array();
		foreach($result as $row) {
			$results = array_merge($results, $row['All_Cases']);
		}
		
		if($cid == 'all') {
			return $results;
		}
		
		foreach($results as $row) {
			if(strtolower($row['case_name']) == strtolower($cid)) {
				$row['empty'] = false;
				return $row;
			}
		}
		

		return array('case_name' => $cid, 'details' => array(), 'empty' => true);
		
	}
	
	public function get($limit = 100, $range = false, $apps = array()) {
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => array(
				'cases' => array(
					"terms" => array(
						"field" => "cases.name",
						"size" => $limit
					),
					"aggs" => [
						"sid" => [ "cardinality" => [ "field" => "sid", "precision_threshold" => 200 ] ]
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
				
				$case_data = '{}';
				$ans[] = array('name' => $bucket['key'], 'count' => $bucket['sid']['value'], 'checkable' => false, 'case_data' => $this->get_case_data($bucket['key']));
				
			}
			return $ans;
			
		} 
		
		return $ans;
		
	}
	
	public function get_case_sessions($limit = 100, $range = array(), $apps, $cid) {
		
		$sort      = 'date';
		$sortorder = 'desc';
		
		switch($sort) {
			case 'date':
				$sortfield = 'date';
			break;
			case 'counter':
				$sortfield = 'score';
			break;
			case 'type':
				$sortfield = 'alerts_count';
			break;
			
		}
		
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"sid" => [ 
				
					"terms" => [ "field" => "sid", "size" => 100, "order" => [ $sortfield => $sortorder ] ],
					"aggs" => [
						"country_code" => [ 
							"terms" => [ "field" => "country_code", "size" => 1 ] 
						],
						"city" => [ 
							"terms" => [ "field" => "city" , "size" => 1 ] 
						],
						"id" => [ 
							"terms" => [ "field" => "_id" , "size" => 1 ] 
						],
						"ip_orig" => [
							"terms" => [ "field" => "ip_orig" , "size" => 1 ]
						],
						"host" => [
							"terms" => [ "field" => "host" , "size" => 100 ]
						],
						"alerts_count" => [
							"sum" => [ "field" => "alerts_count" ]
						],
						"score" => [
							"avg" => [ "field" => "alerts.score" ]
						],
						"alerts_names" => [
							"terms" => [ "field" => "alerts.name", "size" => 100 ]
						],
						"date" => [
							"min" => [ "field" => "ts" ]
						],
					],
				
				],
				"sid_count" => [
					"cardinality" => [ "field" => "sid", "precision_threshold" => 200 ],
				]
			],
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
					]
				],
			],
		];
		
		$params['body']['query']['bool']['must'][] = [ 'term' => [ "http.cases.name" => $cid ] ];
		
		if(!empty($range)) {
			$params['body']['query']['bool']['must'][] = [ 'range' => [ 'ts' => [ 'gte' => intval($range['start']), 'lte' => intval($range['end']) ] ] ];
		}
		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		$result = $this->elasticClient->search($params);
		
		$results = array('items' => array());
		
		if(isset($result["aggregations"]) && 
		   isset($result["aggregations"]["sid"]) && 
		   isset($result["aggregations"]["sid"]["buckets"]) && 
		   !empty($result["aggregations"]["sid"]["buckets"])) {
				
				$sid_buckets = $result["aggregations"]["sid"]["buckets"];
				foreach($sid_buckets as $sid) {
				
					$results['items'][] = array(
						"sid"     => $sid['key'],
						"city"    => $sid['city']['buckets'][0]['key'], 
						"alerts_count"  => $sid['alerts_count']['value'], 
						"alerts_names"  => $sid['alerts_names']['buckets'], 
						"country" => strtoupper($sid['country_code']['buckets'][0]['key']),
						"ip_orig" => long2ip($sid['ip_orig']['buckets'][0]['key']),
						"host"    => $sid['host']['buckets'],
						"count"   => $sid['doc_count'],
						"score"  => $sid['score']['value'],
						"date"  => $sid['date']['value']
					);
			}
		}

		$results['success'] = true;
		$results['query']   = $params;
		$results['count']   = intval($result["aggregations"]['sid_count']['value']);
		return $results;
		
	}

	public function get_last_case_update()
	{
		$params = [
			'index' => 'telepath-config',
			'type' => 'cases',
			'id' => 'cases_id',
			'_source' => 'last_update'
		];

		$response = $this->elasticClient->get($params);
		return $response['_source']['last_update'];
	}

	public function set_last_case_update($update_time)
	{
		$params = [
			'index' => 'telepath-config',
			'type' => 'cases',
			'id' => 'cases_id',
			'body' => [
				'doc' => [
					'last_update' => $update_time
				]
			]
		];

		$response = $this->elasticClient->update($params);
		return $response;
	}

	public function flag_requests_by_cases($cases_name, $range, $method, $repeat)
	{

		$params = [
			"search_type" => "scan",    // use search_type=scan
			"scroll" => "1m",          // how long between scroll requests. should be small!
			"size" => 999,               // how many results *per shard* you want back
			"index" => 'telepath-20*',
			"_source" => ['cases.name', 'cases_count']
		];


		if ($repeat)
			$update_time = time();

		if ($method != 'add') {

			foreach ($cases_name as $case) {
				$params['body']['query']['bool']['must'][] = ['term' => ["cases.name" => $case]];
				$docs = $this->elasticClient->search($params);

				$scroll_id = $docs['_scroll_id'];   // The response will contain no results, just a _scroll_id

				// Now we loop until the scroll "cursors" are exhausted
				while (\true) {

					// Execute a Scroll request
					$response = $this->elasticClient->scroll([
							"scroll_id" => $scroll_id,  //...using our previously obtained _scroll_id
							"scroll" => "1m"           // and the same timeout window
						]
					);

					// Check to see if we got any search hits from the scroll
					if (count($response['hits']['hits']) > 0) {
						$this->update_requests($response['hits']['hits'], $case, true);
						// Get new scroll_id
						$scroll_id = $response['_scroll_id'];
					} else {
						// No results, scroll cursor is empty.  You've exported all the data
						break;
					}
				}

			}

		}

		if ($method != 'delete') {
			if ($cases_name == 'all')
				$cases = $this->get_case_data('all');
			else
				$cases = [$this->get_case_data($cases_name[0])];

			foreach ($cases as $case) {
				$params['body'] = [];
				foreach ($case['details'] as $condition) {

					if (!$condition['negate'])
						$appear = 'must';
					else
						$appear = 'must_not';

					switch ($condition['type']) {
						case "application":
							$term = "host";
							break;
						case "country":
							$term = "country_code";
							break;
						case "IP":
							$term = "ip_orig";
							break;
						case "rules":
							$term = "alerts.name";
							break;
						case "parameters":
							$term = "parameters.name";
							break;
					}
					$params['body']['query']['bool'][$appear][] = ['query_string' => ["default_field" => $term, "query" => str_replace(',', ' OR ', $condition['value'])]];


				}

				if ($range)
					$params['body']['query']['bool']['must'][] = ['range' => ['ts' => ['gte' => intval($update_time), 'lte' => intval($this->get_last_case_update())]]];


				$docs = $this->elasticClient->search($params);

				$scroll_id = $docs['_scroll_id'];   // The response will contain no results, just a _scroll_id

			// Now we loop until the scroll "cursors" are exhausted
				while (\true) {

					// Execute a Scroll request
					$response = $this->elasticClient->scroll([
							"scroll_id" => $scroll_id,  //...using our previously obtained _scroll_id
							"scroll" => "1m"           // and the same timeout window
						]
					);

					// Check to see if we got any search hits from the scroll
					if (count($response['hits']['hits']) > 0) {
						// If yes, Do Work Here
						$this->update_requests($response['hits']['hits'], $case['case_name'], false);
						// Get new scroll_id
						// Must always refresh your _scroll_id!  It can change sometimes
						$scroll_id = $response['_scroll_id'];
					} else {
						// No results, scroll cursor is empty.  You've exported all the data
						break;
					}
				}

			}


			if ($repeat) {
				$this->set_last_case_update($update_time);
				sleep($repeat);
				$this->flag_requests_by_cases($cases_name, $range, $method, $repeat);
			}
		}

		return_success();
	}

	public function update_requests($results, $case_name, $delete)
	{

		foreach ($results as $result) {

			//	TODO  - migrate the update case_name and case_count from php to elastic, with groovy script
			if (isset ($result['_source']['cases.name']) && !empty($result['_source']['cases.name'])) {
				if (!$delete && !in_array($case_name, $result['_source']['cases.name'])) {
					array_push($result['_source']['cases.name'], $case_name);
					$db_case_name = $result['_source']['cases.name'];
				} elseif ($delete && in_array($case_name, $result['_source']['cases.name']))
					$db_case_name = array_diff($result['_source']['cases.name'], [$case_name]);
			} else
				$db_case_name = [$case_name];

			if (isset ($result['_source']['cases_count']) && !empty($result['_source']['cases_count'])) {
				if ($delete)
					$db_case_count = $result['_source']['cases_count'] - 1;
				else
					$db_case_count = $result['_source']['cases_count'] + 1;
			} else
				$db_case_count = 1;

			$params = [
				'index' => $result['_index'],
				'type' => 'http',
				'id' => $result['_id'],
//					'body' => [
//						"file" => "case_flag", //if (ctx._source.containsKey("cases.name")) { ctx._source.cases.name += case_name }
//					'params' => [
//						'case_name' => $case['case_name']
//					]
//				]
				'body' => [
					'doc' => [
						'cases.name' => $db_case_name,
						'cases_count' => $db_case_count
					]
				]
			];

			$this->elasticClient->update($params);
		}
	}

	public function new_get_case_sessions($limit = 100, $range = array(), $apps, $case_data){
		$sort      = 'date';
		$sortorder = 'desc';

		switch($sort) {
			case 'date':
				$sortfield = 'date';
				break;
			case 'counter':
				$sortfield = 'score';
				break;
			case 'type':
				$sortfield = 'alerts_count';
				break;

		}

		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"sid" => [

					"terms" => [ "field" => "sid", "size" => 100, "order" => [ $sortfield => $sortorder ] ],
					"aggs" => [
						"country_code" => [
							"terms" => [ "field" => "country_code", "size" => 1 ]
						],
						"city" => [
							"terms" => [ "field" => "city" , "size" => 1 ]
						],
						"id" => [
							"terms" => [ "field" => "_id" , "size" => 1 ]
						],
						"ip_orig" => [
							"terms" => [ "field" => "ip_orig" , "size" => 1 ]
						],
						"host" => [
							"terms" => [ "field" => "host" , "size" => 100 ]
						],
						"alerts_count" => [
							"sum" => [ "field" => "alerts_count" ]
						],
						"score" => [
							"avg" => [ "field" => "alerts.score" ]
						],
						"alerts_names" => [
							"terms" => [ "field" => "alerts.name", "size" => 100 ]
						],
						"date" => [
							"min" => [ "field" => "ts" ]
						],
					],

				],
				"sid_count" => [
					"cardinality" => [ "field" => "sid", "precision_threshold" => 200 ],
				]
			],
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
					]
				],
			],
		];

		foreach ($case_data['details'] as $condition){

				if ($condition['negate']=="false")
					$appear='must';
				else
					$appear='must_not';

				switch ($condition['type']){
					case "application":
						$term="http.host";
						break;
					case "country":
						$term="http.country_code";
						break;
					case "IP":
						$term="http.ip_orig";
						break;
				}
			$params['body']['query']['bool'][$appear][] = [ 'term' => [$term  => $condition['value'] ] ];

		}

		//$params['body']['query']['bool']['must'][] = [ 'term' => [ "http.cases.name" => $cid ] ];

		if(!empty($range)) {
			$params['body']['query']['bool']['must'][] = [ 'range' => [ 'ts' => [ 'gte' => intval($range['start']), 'lte' => intval($range['end']) ] ] ];
		}

		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		$result = $this->elasticClient->search($params);

		$results = array('items' => array());

		if(isset($result["aggregations"]) &&
			isset($result["aggregations"]["sid"]) &&
			isset($result["aggregations"]["sid"]["buckets"]) &&
			!empty($result["aggregations"]["sid"]["buckets"])) {

			$sid_buckets = $result["aggregations"]["sid"]["buckets"];
			foreach($sid_buckets as $sid) {

				$results['items'][] = array(
					"sid"     => $sid['key'],
					"city"    => $sid['city']['buckets'][0]['key'],
					"alerts_count"  => $sid['alerts_count']['value'],
					"alerts_names"  => $sid['alerts_names']['buckets'],
					"country" => strtoupper($sid['country_code']['buckets'][0]['key']),
					"ip_orig" => long2ip($sid['ip_orig']['buckets'][0]['key']),
					"host"    => $sid['host']['buckets'],
					"count"   => $sid['doc_count'],
					"score"  => $sid['score']['value'],
					"date"  => $sid['date']['value']
				);
			}
		}

		$results['success'] = true;
		$results['query']   = $params;
		$results['count']   = intval($result["aggregations"]['sid_count']['value']);
		return $results;
	}
	
	public function get_case_sessions_chart($range, $apps, $cid = false) {
		
		$dots  = 20;
		$step  = ($range['end'] - $range['start']) / $dots;

		$chart = array();
		
		for($x = 0; $x < $dots; $x++) {
			
			// LIM
			
			$scope_start = $range['start'] + ($x * $step);       // 4JS
			$scope_end   = $range['start'] + (($x + 1) * $step); // 4JS
				
			// QUERY
			
			$params['body'] = array(
				'size'  => 0,
				'aggs'  => array(
					'sid' => array(
						"cardinality" => [
							"field" => "sid",
						]
					)
				),
				'query' => [
					'bool' => [
						'must' => [
							[ 'term' => [ '_type' => 'http' ] ],
							[ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'cases' ] ] ] ],
						]
					]
				]
			);
			
			$params['body']['query']['bool']['must'][] = [ 'term' => [ "http.cases.name" => $cid ] ];
			$params['body']['query']['bool']['must'][] = [ 'range' => [ 'ts' => [ 'gte' => $scope_start, 'lte' => $scope_end ] ] ];
			
			
			$params = append_application_query($params, $apps);
			$params = append_access_query($params);
			
			$results   = $this->elasticClient->search($params);
			if(!empty($results) && isset($results['aggregations']['sid'])) {
				$val     = intval($results['aggregations']['sid']['value']);
				$chart[] = array($scope_end * 1000, $val);
			}
							
				
				
		}
		//print_r($params);
		//print_r($chart);
		
		return $chart;
		
	}
		
	
	public function delete($cids) {
		
		// Cast to array in case of 1 item
		if(!is_array($cids)) {
			$cids = array($cids);
		}
		
		// Generic cases query
		$params = [];
		$params['body'] = [
			'size' => 100,
			'query' => [ 'term' => [ '_id' => 'cases_id' ] ]
		];
		
		// Gather data
		$result = get_elastic_results($this->elasticClient->search($params));
		
		// No data to delete from?
		if(empty($result) || !isset($result[0]['All_Cases'])) {
			return;
		}
		
		// Collect new case data, excluding deleted cases
		$new_data = array();
		foreach($result[0]['All_Cases'] as $case) {
			$found = false;
			foreach($cids as $cid) {
				if($case['case_name'] == $cid) {
					$found = true;
				}
			}
			if(!$found) {
				$new_data[] = $case;
			}
		}
		
		// Update our document
		$action_data = [
		   'index'       => 'telepath-config',
		   'type'        => 'cases',
		   'id'          => 'cases_id',
		];

		$action_data['body'] = array('All_Cases' => $new_data);
		$this->elasticClient->index($action_data);
		$this->elasticClient->indices()->refresh(array('index' => 'telepath-config'));
		
	}
	
	public function create($name, $details) {
		
		$params = [];
		$params['body'] = [
			'size' => 100,
			'query' => [ 'term' => [ '_id' => 'cases_id' ] ]
		];

		$result = get_elastic_results($this->elasticClient->search($params));
		
		if(empty($result)) {
			die;
		}
		
		$action_data = [
		   'index'       => 'telepath-config',
		   'type'        => 'cases',
		   'id'          => 'cases_id',
		];

		$result[0]['All_Cases'][] = array('case_name' => $name, 'created' => time(), 'details' => $details);
		
		$action_data['body'] = array('All_Cases' => $result[0]['All_Cases']);

		// Delete previous case data
		$deleteParams = array();
		$deleteParams['index'] = 'telepath-config';
		$deleteParams['type'] = 'cases';
		$deleteParams['id'] = 'cases_id';
		$retDelete = $this->elasticClient->delete($deleteParams);
		$this->elasticClient->indices()->refresh(array('index' => 'telepath-config'));
		
		// Index new data
		// Sample:: 
		// {"index":"telepath-config","type":"cases","id":"cases_id","body":{"All_Cases":[{"case_name":"Locals","details":[{"type":"country","negate":false,"value":"00"},{"type":"IP","negate":false,"value":"192.168.1.1-192.168.1.254"},{"type":"application","negate":true,"value":"www.hybridsec.com"}]},{"case_name":"Hackers","details":[{"type":"country","negate":false,"value":"CN"}]},{"case_name":"Americans","details":[{"type":"country","negate":false,"value":"US"}]},{"case_name":"Israelis","details":[{"type":"country","negate":false,"value":"IL"}]},{"case_name":"Trololo","created":1428320346,"details":[{"type":"rules","negate":false,"value":[{"type":"group","id":"Known Bad IP","category":"Hybrid"},{"type":"group","id":"ShellShock","category":"Hybrid"}]},{"type":"application","negate":false,"value":"ie.rempel.net"},{"type":"IP","negate":false,"value":"111.111.111.111,222.222.222.222,33.33.33.33-33.33.33.34"}]}]}}
		
		$this->elasticClient->index($action_data);
		$this->elasticClient->indices()->refresh(array('index' => 'telepath-config'));
		
	}
	
	public function update($name, $data) {
		
		$params = [];
		$params['body'] = [
			'size' => 100,
			'query' => [ 'term' => [ '_id' => 'cases_id' ] ]
		];
		
		$result = get_elastic_results($this->elasticClient->search($params));
		
		if(empty($result)) {
			die;
		}
		
		$action_data = [
		   'index'       => 'telepath-config',
		   'type'        => 'cases',
		   'id'          => 'cases_id',
		];

		foreach($result[0]['All_Cases'] as $key => $value) {
			if($result[0]['All_Cases'][$key]['case_name'] == $name) {
				$result[0]['All_Cases'][$key]['details'] = $data;
			}
		}

		$action_data['body'] = array('All_Cases' => $result[0]['All_Cases']);
		
		$this->elasticClient->index($action_data);
		$this->elasticClient->indices()->refresh(array('index' => 'telepath-config'));
		
	}
	
}

?>
