<?php

class M_Alerts extends CI_Model {
	
	function __construct() {
		parent::__construct();
		
		// Connect elastic
		//$params = array('hosts' => array('127.0.0.1:9200'));
//$params['logging'] = true;
//$params['logPath'] = '/tmp/elasticsearch.log';
		$this->elasticClient = new Elasticsearch\Client();
	}

	public function get_time_chart($range, $apps = array(), $search = '', $alerts_filter = [], $actions_filter = []) {
		
		
		$dots  = 10;
		$step  = ($range['end'] - $range['start']) / $dots;

		$chart = array();
		
		for($x = 0; $x < $dots; $x++) {
			
			// LIM

			$scope_start = $range['start'] + ($x * $step);       // 4JS
			$scope_end   = $range['start'] + (($x + 1) * $step); // 4JS

			$params['index'] = 'telepath-20*';
			$params['type'] = 'http';
			$params['body'] = [
			'size'  => 0,
			'aggs'  => array(
				'sid' => array(
					"sum" => [
						"field" => "alerts_count",
					]
				)
			),
			'query' => [
				'bool' => [
					'filter' => [
						 [ 'exists' => [ 'field' => 'alerts_count' ] ] ,
					]
				]
			]
			];

			global $query;
			$query='';

			if (count($alerts_filter) > 0 && $alerts_filter != false) {
				$query .= 'alerts.name:"' . implode('" OR "', $alerts_filter) . '"';
			}
			if (count($actions_filter) > 0 && $actions_filter != false) {
				$query .= ' business_actions.name:"' . implode('" OR "', $actions_filter) . '"';
			}


			if($search && strlen($search) > 1) {

				if ((count($alerts_filter) > 0 && $alerts_filter != false) || (count($actions_filter) > 0 && $actions_filter != false)) {
					$query.=' ('.$search.')';
				}
				else{
					$query.=$search;
				}

			}

			if($query)
				$params['body']['query']['bool']['must'][] = [ 'query_string' => [ "query" => $query, "default_operator" => 'AND' ] ];

			// QUERY
			$params['body']['query']['bool']['filter'][] = [ 'range' => [ 'ts' => [ 'gte' => $scope_start, 'lte' =>
				$scope_end ] ] ];
			
			$params = append_application_query($params, $apps);
			$params = append_access_query($params);
			
			$results   = $this->elasticClient->search($params);
			
			if(!empty($results) && isset($results['aggregations']['sid'])) {
				$val     = intval($results['aggregations']['sid']['value']);
				$chart[] = array($scope_end * 1000, $val);
			}
							
				
				
		}
		
		return $chart;
		
	}
	
	public function old_get_action_distribution_chart($range, $apps, $search = '', $filter=[]) {
	
		$dist   = array();
		$result = array();
		$max    = 5;

		$params['index'] = 'telepath-20*';
		$params['type'] = 'http';
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"actions" => [ 
					"terms" => [ "field" => "business_actions.name", "size" => 999 ],
				],
			]
		];
		
		$params['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];

		$params = append_range_query($params, $range);

		global $query;
		$query='';

		if (count($filter)>1){
			$query.='alerts.name:"'.implode('" OR "',$filter).'"';
		}

		elseif (count($filter)==1&&$filter!=false){
			$query.='alerts.name:"'.implode('" OR "',$filter).'"';
		}



		if($search && strlen($search) > 1) {

			if (count($filter)>0 &&$filter!=false){
				$query.=' AND ('.$search.')';
			}
			else{
				$query.=$search;
			}

		}

		if($query)
			$params['body']['query']['bool']['must'][] = [ 'query_string' => [ "query" => $query, "default_operator" => 'AND' ] ];

		$params = append_application_query($params, $apps);
		$params = append_access_query($params);
		
		$result = $this->elasticClient->search($params);
		$results = array();
		
		if(isset($result["aggregations"]) && 
		   isset($result["aggregations"]["actions"]) && 
		   isset($result["aggregations"]["actions"]["buckets"]) && 
		   !empty($result["aggregations"]["actions"]["buckets"])) {
		   
				$action_buckets = $result["aggregations"]["actions"]["buckets"];
				foreach($action_buckets as $action_bucket) {
				
					$results[] = [
						"label"     => $action_bucket['key'],
						"data"    => $action_bucket['doc_count'], 
					];
			}
		}
		
		return $results;

	}

	public function get_action_distribution_chart($range, $apps, $search = '', $alerts_filter = [])
	{

		if ($range) {
			$params['index'] = $range['indices'];
		} else {
			$params['index'] = 'telepath-20*';
		}
		$params['type'] = 'http';
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				/*"actions" => [
                    "terms" => [ "field" => "business_actions.name", "size" => 999 ],
                ],*/
				"sid" => [
					"terms" => ["field" => "sid",
						"size" => 999
					]
				],
			]
		];


		$params['body']['query']['bool']['must'][] = ['filtered' => ['filter' => ['exists' => ['field' => 'alerts']]]];

		$params = append_range_query($params, $range);

		global $query;
		$query = '';

		if (count($alerts_filter) > 0 && $alerts_filter != false) {
			$query .= 'alerts.name:"' . implode('" OR "', $alerts_filter) . '"';
		}


		if ($search && strlen($search) > 1) {

			if (count($alerts_filter) > 0 && $alerts_filter != false) {
				$query .= ' (' . $search . ')';
			} else {
				$query .= $search;
			}

		}

		if ($query)
			$params['body']['query']['bool']['must'][] = ['query_string' => ["query" => $query, "default_operator" => 'AND']];

		$params = append_application_query($params, $apps);
		$params = append_access_query($params);

		$result = $this->elasticClient->search($params);

		$results = array();
		$results2 = [];
		if (isset($result["aggregations"]) &&
			isset($result["aggregations"]["sid"]) &&
			isset($result["aggregations"]["sid"]["buckets"]) &&
			!empty($result["aggregations"]["sid"]["buckets"])
		) {

			$sid_buckets = $result["aggregations"]["sid"]["buckets"];
			foreach ($sid_buckets as $sid) {
				$params2 = [];
				if ($range) {
					$params2['index'] = $range['indices'];
				} else {
					$params2['index'] = 'telepath-20*';
				}
				$params2['type'] = 'http';
				$params2['body'] = [
					"size" => 0,
					"aggs" => [
						"actions" => [
							"terms" => ["field" => "business_actions.name", "size" => 999]
						]
					]
				];

				$params2['body']['query']['bool']['filter'][] = ['term' => ['sid' => $sid['key']]];

				$params2 = append_range_query($params2, $range);

				$result2 = $this->elasticClient->search($params2);

				if (isset($result2["aggregations"]) &&
					isset($result2["aggregations"]["actions"]) &&
					isset($result2["aggregations"]["actions"]["buckets"]) &&
					!empty($result2["aggregations"]["actions"]["buckets"])
				) {

					$action_buckets = $result2["aggregations"]["actions"]["buckets"];

					foreach ($action_buckets as $key => $value) {
						if (isset($results [$value['key']])) {
							$results [$value['key']] += $value['doc_count'];
						} else {
							$results [$value['key']] = $value['doc_count'];
						}
					}
				}
			}

			foreach ($results as $key => $value) {
				$results2[] = [
					'label' => $key,
					"data" => $value
				];
			}
		}
		return $results2;
	}

	public function get_distribution_chart($range, $apps, $search = '', $actions_filter = []) {

		$dist   = array();
		$result = array();
		$max    = 5;

		if ($range) {
			$params['index'] = $range['indices'];
		} else {
			$params['index'] = 'telepath-20*';
		}
		$params['type'] = 'http';
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"alerts_names" => [
					"terms" => [ "field" => "alerts.name", "size" => 10, "order" => [ "alerts_count" => "desc" ] ],
					"aggs" => [
						"alerts_count" => [
							"sum" => [ "field" => "alerts_count" ]
						],
					],
				],
			]
		];

		$params['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];

		global $query;
		$query = '';

		$params = append_range_query($params, $range);
		if (count($actions_filter) > 0 && $actions_filter != false) {
			$query .= 'business_actions.name:"' . implode('" OR "', $actions_filter) . '"';
		}

		if ($search && strlen($search) > 1) {

			/*if (count($actions_filter) > 0 && $actions_filter != false) {
				$query .= ' (' . $search . ')';
			} else {*/
				$query .= $search;
//			}

		}
		if($query)
			$params['body']['query']['bool']['must'][] = [ 'query_string' => [ "query" => $query, "default_operator" => 'AND' ] ];

		$params = append_application_query($params, $apps);
		$params = append_access_query($params);

		$result = $this->elasticClient->search($params);
		$results = array();
		
		if(isset($result["aggregations"]) && 
		   isset($result["aggregations"]["alerts_names"]) && 
		   isset($result["aggregations"]["alerts_names"]["buckets"]) && 
		   !empty($result["aggregations"]["alerts_names"]["buckets"])) {
		   
				$alerts_buckets = $result["aggregations"]["alerts_names"]["buckets"];
				foreach($alerts_buckets as $alerts_bucket) {
				
					$results[] = [
						"label"     => $alerts_bucket['key'],
						"data"    => $alerts_bucket['doc_count'], 
					];
			}
		}
		
		return $results;

	}
	
	public function get_alerts($sort, $sortorder, $displayed = false, $limit = 100, $range = [], $apps = [], $search = '', $alerts_filter = [], $actions_filter = []) {
		
		switch($sort) {
		
			case 'date':
				$sortfield = 'date';
			break;
			case 'count':
				$sortfield = 'alerts_count';
			break;
//			case 'score':
//				$sortfield = 'last_score';
//			break;
//			case 'name':
//				$sortfield = 'alerts_names';
//			break;
			default:
				$sortfield = 'alerts_count';
			break;
		}

		if ($range) {
			$params['index'] = $range['indices'];
		} else {
			$params['index'] = 'telepath-20*';
		}
		$params['type'] = 'http';
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"sid" => [ 

					"terms" => [ "field" => "sid", "size" => $limit , "order" => [ $sortfield => $sortorder ] ],
					"aggs" =>[
						"score_average" => [
							"avg" => ["field" => "score_average"]
						]
					]
					/*					"aggs" => [
                    						"alerts_count" => [
                    							"sum" => [ "field" => "alerts_count" ]
                    						],

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
                                                "terms" => [ "field" => "host" , "size" => 10 ]
                                            ],
                                            "score" => [
                                                "avg" => [ "field" => "alerts.score" ]
                                            ],
                                            "alerts_names" => [
                                                "terms" => [ "field" => "alerts.name", "size" => 10 ]
                                            ],
                                            "actions_count" => [
                                                "sum" => [ "field" => "business_actions_count" ]
                                            ],
                                            "actions_names" => [
                                                "terms" => [ "field" => "business_actions.name", "size" => 10 ]
                                            ],
                                            "date" => [
                                                "max" => [ "field" => "ts" ]
                                            ],

                                        ],
                    */
				],
				"sid_count" => [
					"cardinality" => [ "field" => "sid" ],
				]
			],
			'query' => [
				'bool' => [
					'filter' => [
						[ 'exists' => [ 'field' => 'alerts' ] ],
					]
				],
			],
		];
		if ($displayed) {
			$params['body']['query']['bool']['must_not'][] = ['terms' => ['sid' => $displayed]];
		}

//		$params['body']['query']['bool']['must'][] = [ 'range' => [ 'alerts_count' => [ 'gte' => 1 ] ] ];


		$params = append_range_query($params, $range);
		
		/*if($search && strlen($search) > 1) {
			$params['body']['query']['bool']['must'][] = [ 'query_string' => [ "query" => $search, "default_operator" => 'AND'  ] ];
		}*/

		global $query;
		$query='';

		if ((count($alerts_filter) > 0 && $alerts_filter != false) || (count($actions_filter) > 0 && $actions_filter != false)) {

			if (count($alerts_filter) > 0 && $alerts_filter != false) {
				$query .= 'alerts.name:"' . implode('" OR "', $alerts_filter) . '"';
			}
			/*if (count($actions_filter) > 0 && $actions_filter != false) {
				if (count($alerts_filter) > 0 && $alerts_filter != false) {
					$query .= ' business_actions.name:"' . implode('" OR "', $actions_filter) . '"';
				} else {
					$query .= ' business_actions.name:"' . implode('" OR "', $actions_filter) . '"';
				}
			}*/
		}
		if ($search && strlen($search) > 1) {

			if ((count($alerts_filter) > 0 && $alerts_filter != false) /*|| (count($actions_filter) > 0 && $actions_filter != false)*/) {
				$query .= ' (' . $search . ')';
			} else {
				$query .= $search;
			}
		}

		if($query)
			$params['body']['query']['bool']['must'][] = [ 'query_string' => [ "query" => $query, "default_operator" => 'AND'] ];

		if ($sortfield == "date") {
			$params['body']["aggs"]["sid"]["aggs"]["date"] = ["max" => ["field" => "ts"]];
		} else if ($sortfield == "alerts_count") {
			$params['body']["aggs"]["sid"]["aggs"]["alerts_count"] = ["sum" => [ "field" => "alerts_count" ]];
		}
//		else if ($sortfield == "last_score") {
//			$params['body']["aggs"]["sid"]["aggs"]["last_score"] = [
//				"terms" => [
//					"field" => "ip_score",
//					"size" => 1,
//					"order" => ["date" => "desc"]
//				],
//				'aggs' => [
//					'date' => [
//						"max" => ["field" => "ts"]
//					]
//				]
//			];
//		}

		
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);

		$result = $this->elasticClient->search($params);
	
		$results = array('items' => array());

		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"sid" => [
					"terms" => [ "field" => "sid", "size" => 999]
				],
			],
			'query' => [
				'bool' => [
					'filter' => [
						[ 'exists' => [ 'field' => 'business_actions' ] ],
					]
				],
			],
		];

		global $query;
		$query = '';

		$params = append_range_query($params, $range);
		if (count($actions_filter) > 0 && $actions_filter != false) {
			$query .= 'business_actions.name:"' . implode('" OR "', $actions_filter) . '"';
		}

		if ($search && strlen($search) > 1) {

			if (count($actions_filter) > 0 && $actions_filter != false) {
				$query .= ' (' . $search . ')';
			} else {
				$query .= $search;
			}
		}
		if ($query)
			$params['body']['query']['bool']['must'][] = ['query_string' => ["query" => $query, "default_operator" => 'AND']];
		$params = append_range_query($params, $range);
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);


		$result2 = $this->elasticClient->search($params);

		$result2 = $result2['aggregations']["sid"]['buckets'];

		$actions_sid = [];

		foreach ($result2 as $res){
			$actions_sid[] = $res['key'];
		}

		$count = 0;
//
//		$count_offset = 0;
//		$count_insert = 0;
//
		if(isset($result["aggregations"]) && 
		   isset($result["aggregations"]["sid"]) && 
		   !empty($result["aggregations"]["sid"]["buckets"])) {
		   
			$sid_buckets = $result["aggregations"]["sid"]["buckets"];
			foreach($sid_buckets as $sid) {
				
//				if($count_offset >= $displayed) {

						$sid_key = $sid['key'];
						$doc_count = $sid['doc_count'];
						$score_average = $sid['score_average']['value'];

						$params2 = array();
					if ($range) {
						$params2['index'] = $range['indices'];
					} else {
						$params2['index'] = 'telepath-20*';
					}
						$params2['type'] = 'http';
						$params2['body'] = [
							'size' => 0,
							"aggs" => [
								"alerts_count" => [
									"sum" => [ "field" => "alerts_count" ]
								],
								"cases_count" => [
									"sum" => [ "field" => "cases_count" ]
								],
								"country_code" => [
									"terms" => [ "field" => "country_code", "size" => 1 ]
								],
								"city" => [
									"terms" => [ "field" => "city" , "size" => 1 ]
								],
//								"id" => [
//									"terms" => [ "field" => "_id" , "size" => 1 ]
//								],
								"ip_orig" => [
									"terms" => [ "field" => "ip_orig" , "size" => 1 ]
								],
								"host" => [
									"terms" => [ "field" => "host" , "size" => 10 ]
								],
								"score" => [
									"avg" => [ "field" => "alerts.score" ]
								],
								"alerts_names" => [
									"terms" => [ "field" => "alerts.name", "size" => 10 ]
								],
								"cases_names" => [
									"terms" => [ "field" => "cases_name", "size" => 10 ]
								],
								"actions_count" => [
									"sum" => [ "field" => "business_actions_count" ]
								],
								"actions_names" => [
									"terms" => [ "field" => "business_actions.name", "size" => 10 ]
								],
								"date" => [
									"max" => [ "field" => "ts" ]
								],
								"user" =>[
									"terms" => ["field" => "username",
										"order" => ["_term" => "desc"],
										"size" => 1
									]
								]/*,
								"last_score" => [
									"terms" => [
										"field" => "ip_score",
										"size" => 1,
										"order"=>["max_ts" => "desc" ]
									],
									'aggs'=>[
										'max_ts'=>[
											"max" => [ "field" => "ts"]
										]
									]
								]*/
							]
						];

				$params2['body']['query']['bool']['filter'][] = [ 'term' => ['sid' => $sid['key'] ] ];


				$params2 = append_range_query($params2, $range);

					$result2 = $this->elasticClient->search($params2);
						$sid = $result2['aggregations'];

						$results['items'][] = array(
							"sid"     => $sid_key,
							"city"    => $sid['city']['buckets'][0]['key'], 
							"alerts_count"  => $sid['alerts_count']['value'], 
							"alerts_names"  => $sid['alerts_names']['buckets'],
							"actions_count"  => $sid['actions_count']['value'],
							"cases_count" => $sid['cases_count']['value'],
							"cases_names"=>	$sid['cases_names']['buckets'],
							"actions_names"  => $sid['actions_names']['buckets'], 
							"country" => strtoupper($sid['country_code']['buckets'][0]['key']),
							"ip_orig" => long2ip($sid['ip_orig']['buckets'][0]['key']),
							"host"    => $sid['host']['buckets'],
							"count"   => $doc_count,
							"score"  => $sid['score']['value'],
							"date"  => $sid['date']['value'],
							'ip_score' => $score_average,
							"user" => $sid['user']['buckets'][0]['key']
						);
//						$count_insert++;
//						if($count_insert >= $limit) {
//							break;
//						}
					
				/*} else {
					$count_offset++;
				}
				*/
			}
			
			$count = $result["aggregations"]["sid_count"]["value"];
				
		}
		if ($sort =='date') {

		if ($sortorder == 'ASC') {
			$sortorder = SORT_ASC;
		}
		elseif ($sortorder == 'DESC') {
			$sortorder =  SORT_DESC;
		}

			# Fix the problem we have with sort.
			# When sorting alerts by date we are getting other requests
			# with the same session id. As a result we need to perform
			# second sort. Yuli
			$temp = array();
			$ar = $results['items'];
			foreach ($ar as $key => $row)
			{
				$temp[$key] = $row['date'];
			}
			array_multisort($temp, $sortorder, $ar);
			$results['items'] = $ar;
		}
		
		$results['success'] = true;
		$results['query'] = $params;
		$results['count'] = $count;
		return $results;
		
			
	}
	
	// Generic
		
	// TODO::
	
	public function alerts_for_RIDS($RIDS = array()) {
		if(empty($RIDS)) { return array(); }
		return $alerts;
	}
	
	public function alert_for_RID($RID) {
		return empty($res) ? false : $res[0];
	}
	
	public function get($limit = false) {
		return array();
	}
	
	public function count_alerts($to, $from, $rule_group, $apps = array(), $case_id = -1) {
		return 0;
	}
	
	public function time_diff($date, $count, $mode) {
		return 0; // PHP based (copy from v2 dashboard)
	}
	
}

?>
