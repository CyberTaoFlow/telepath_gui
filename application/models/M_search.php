<?php

class M_Search extends CI_Model {
	
	function __construct() {

		parent::__construct();

	}

	function search($scope, $settings, $suspect_threshold = false, $limit = 15)
	{

		switch($settings['sort']) {

			case 'date':
				$sortfield = 'date';
				break;
			case 'count':
//				if($scope=='alerts' || $scope == 'cases' ){
//					$sortfield = $scope.'_count';
//				}
//				else{
					$sortfield = '_count';
//				}

				break;
//			case 'score':
//				$sortfield = 'last_score';
//			break;
			default:
				$sortfield = 'date';
				break;
		}


		$params['index'] = $settings['range']['indices'];
		$params['type'] = 'http';
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"sid" => [ 
				
					"terms" => [ "field" => "sid", "size" => $limit, "order" => [ $sortfield => $settings['dir'] ] ],
					"aggs" => [
						"score_average" => [
							"avg" => ["field" => "score_average"]
						]
					],
				
				],
				"sid_count" => [
					"cardinality" => [ "field" => "sid" ],
				]
			],
			'query' => [
				'bool' => [
					'filter' => [
						[
                            'query_string' => [
//                                "query" => json_encode($settings['search']),
								"fields" => [
									'status_code',
									'city.search',
									'title.search',
									'sid',
									'ip_resp',
									'host.search',
									'ip_orig',
									'method',
									'business_actions.search',
									'canonical_url.search',
									'uri.search',
									'alerts.name.search',
									'country_code.search',
									'cases_name.search',
									'parameters.name',
									'parameters.type',
									'parameters.value.search',
									'username.search'
								],
								"query" => $settings['search'],
								"default_operator" => 'AND',
								"lenient" => true
                            ] 
                        ]
					],
				],
			],
		];
		if ($settings['displayed']){
			$params['body']['query']['bool']['must_not'][]=['terms'=>['sid'=> $settings['displayed']]];

		}

		if ($sortfield == "date") {
			$params['body']["aggs"]["sid"]["aggs"]["date"] = ["max" => ["field" => "ts"]];
		}

		$params = append_range_query($params, $settings['range']);


		switch($scope) {
			case 'alerts':
				$params['body']['query']['bool']['filter'][] =  [ 'exists' => [ 'field' => 'alerts_count' ] ];
				//$params['body']["aggs"]["sid"]["aggs"]["alerts_count"] = [ "sum" => [ "field" => "alerts_count" ] ];
				//	$params['body']['query']['bool']['must'][]=[ 'range' => [ 'alerts_count' => [ 'gte' => 1 ] ] ];
				//$params2['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
			break;
			case 'cases':
				// Here we also need cases data
				$params['body']['query']['bool']['filter'][] =  [ 'exists' => [ 'field' => 'cases_name' ] ];
//				$params['body']["aggs"]["sid"]["aggs"]["cases_names"] = [ "terms" => [ "field" => "cases_name", "size" => 100 ] ];
//				$params['body']["aggs"]["sid"]["aggs"]["cases_count"] = [ "sum" => [ "field" => "cases_count" ] ];
//				$params2['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'cases_name' ] ] ] ];
//				$params2['body']["aggs"]["sid"]["aggs"]["cases_names"] = [ "terms" => [ "field" => "cases_name", "size" => 100 ] ];
//				$params2['body']["aggs"]["sid"]["aggs"]["cases_count"] = [ "sum" => [ "field" => "cases_count" ] ];
			break;
			case 'suspects':
				$params['body']['query']['bool']['filter'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
				$params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts_count' ] ];
//				$params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'cases_name' ] ];
//				$params2['body']['query']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
//				$params2['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
			break;
			case 'requests':
				// old method
				$params['body']['query']['bool']['filter'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
				$params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts_count' ] ] ;
//				$params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'cases_name' ] ];
//				$params2['body']['query']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
//				$params2['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
//				$params2['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'cases_name' ] ] ] ];

				// new method !!!
/*
                                $params['body']['query']['filtered']['filter']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
                                $params['body']['query']['filtered']['filter']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts' ] ];
                                $params2['body']['query']['filtered']['filter']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
                                $params2['body']['query']['filtered']['filter']['bool']['must_not'][] =  ['exists' =>  [   'field' => 'alerts'  ] ];
*/
			break;
		}

		$params['timeout'] = $this->config->item('timeout');


		$params = append_application_query($params, $settings['apps']);
		$result = $this->elasticClient->search($params);
		$results = array('items' => array());

		$params2 = array();
		$params2['index'] = $settings['range']['indices'];
		$params2['type'] = 'http';
		$params2['body'] = [
			'size' => 0,
			"aggs" => [
				"country_code" => [
					"terms" => [ "field" => "country_code", "size" => 1 ]
				],
				"city" => [
					"terms" => [ "field" => "city" , "size" => 1 ]
				],
				"ip_orig" => [
					"terms" => [ "field" => "ip_orig" , "size" => 1 ]
				],
				"host" => [
					"terms" => [ "field" => "host" , "size" => 100 ]
				],
				"cases_count" => [
					"sum" => [ "field" => "cases_count" ]
				],
				"cases_names" => [
					"terms" => [ "field" => "cases_name", "size" => 100 ]
				],
				"business_actions_count" => [
					"sum" => [ "field" => "business_actions_count" ]
				],
				"business_actions_names" => [
					"terms" => [ "field" => "business_actions.name", "size" => 100 ]
				],
//				"score" => [
//					"avg" => [ "field" => "score_average" ]
//				],
				"date" => [
					"max" => [ "field" => "ts" ]
				],
				"user" => [
					"terms" => [ "field" => "username",
						"size" => 1,
						"order" => [ "_term" => "desc" ]
					]
				]/*,
				"last_score" => [
					"terms" => [
						"field" => "ip_score",
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

		// Add alerts aggregation for alerts and cases only
		if ($scope == 'alerts' || $scope == 'cases') {
			$params2['body']["aggs"]["alerts_count"] = ["sum" => ["field" => "alerts_count"]];
			$params2['body']["aggs"]["alerts_names"] = ["terms" => ["field" => "alerts.name", "size" => 100]];
		}

		// Add post filter to filter only the query (and not the aggregation) to check if the current session has
		// also results in another tab
		if ($scope == 'requests' || $scope == 'suspects') {
			$params2['body']['post_filter']['bool']['filter'][] = [
				'query_string' => [
					"fields" => [
						'status_code',
						'city.search',
						'title.search',
						'sid',
						'ip_resp',
						'host.search',
						'ip_orig',
						'method',
						'business_actions.search',
						'canonical_url.search',
						'uri.search',
						'alerts.name.search',
						'country_code.search',
						'cases_name.search',
						'parameters.name',
						'parameters.type',
						'parameters.value.search',
						'username.search'
					],
					"query" => $settings['search'],
					"default_operator" => 'AND',
					"lenient" => true
				]
			];
		}

		$params2 = append_range_query($params2, $settings['range']);

		$duplicated_sessions = [];
		$displayed_sessions = [];

		if(isset($result["aggregations"]) && 
		   isset($result["aggregations"]["sid"]) && 
		   isset($result["aggregations"]["sid"]["buckets"]) && 
		   !empty($result["aggregations"]["sid"]["buckets"])) {
		   
				$sid_buckets = $result["aggregations"]["sid"]["buckets"];
				foreach($sid_buckets as $sid) {
		
					$sid_key = $sid['key'];
					$doc_count = $sid['doc_count'];
					$score_average = $sid['score_average']['value'];

					$params3 = $params2;
					
					$params3['body']['query']['bool']['filter'][] = [ 'term' => ['sid' => $sid['key'] ] ];
					$params3['timeout'] = $this->config->item('timeout');

					$result2 = $this->elasticClient->search($params3);


					//TODO: this code doesn't help on pagination. It's only remove duplicate sessions of the current
					// page and update the counter according to the current page.

					// If the current session has also results in another tab, we need to remove it from normal requests
					// tab
					if($scope == 'requests' && $doc_count < $result2['hits']['total']){
						$result["aggregations"]["sid_count"]["value"]--;
						$duplicated_sessions[] = $sid_key;
						continue;
					}

					// If the current session has also results in alerts tab, we need to remove it from suspects tab
					if($scope == 'suspects' && $doc_count < $result2['hits']['total']){
						$params4 = array();
						$params4['index'] = $settings['range']['indices'];
						$params4['type'] = 'http';
						$params4['body']['size'] = 0;
						$params4['body']['query']['bool']['filter'][] = [ 'term' => ['sid' => $sid['key'] ] ];
						$params4['body']['query']['bool']['filter'][] =  [ 'exists' => [ 'field' => 'alerts_count' ] ];
						$params4['body']['query']['bool']['filter'][] = [
							'query_string' => [
								"fields" => [
									'status_code',
									'city.search',
									'title.search',
									'sid',
									'ip_resp',
									'host.search',
									'ip_orig',
									'method',
									'business_actions.search',
									'canonical_url.search',
									'uri.search',
									'alerts.name.search',
									'country_code.search',
									'cases_name.search',
									'parameters.name',
									'parameters.type',
									'parameters.value.search',
									'username.search'
								],
								"query" => $settings['search'],
								"default_operator" => 'AND',
								"lenient" => true
							]
						];
						$params4['timeout'] = $this->config->item('timeout');
						$result4 = $this->elasticClient->search($params4);

						if ($result4['hits']['total']){
							$result["aggregations"]["sid_count"]["value"]--;
							$duplicated_sessions[] = $sid_key;
							continue;
						}
					}

					$sid = $result2['aggregations'];

					$item = array(
						"sid"     => $sid_key, 
						"city"    => $sid['city']['buckets'][0]['key'],
						"cases_count"  => $sid['cases_count']['value'],
						"cases_names"  => $sid['cases_names']['buckets'],
						"actions_count"  => $sid['business_actions_count']['value'], 
						"actions_names"  => $sid['business_actions_names']['buckets'],  
						"country" => $sid['country_code']['buckets'][0]['key'],
						"ip_orig" => $sid['ip_orig']['buckets'][0]['key_as_string'],
						"host"    => $sid['host']['buckets'],
						"count"   => $doc_count,
						//"score_average" => $sid['score']['value'],
						"date"  => $sid['date']['value'],
						'score_average' => $score_average,
						"user" => $sid['user']['buckets'][0]['key']
					);

					if ($scope == 'alerts' || $scope == 'cases') {
						$item['alerts_count'] = $sid['alerts_count']['value'];
						$item['alerts_names'] = $sid['alerts_names']['buckets'];
					}

						$results['items'][] = $item;
						$displayed_sessions[] = $sid_key;
					
				}
				
				$results['total'] = $result["aggregations"]["sid_count"]["value"];


				$results['duplicated_sessions'] = $duplicated_sessions;
				$results['displayed_sessions'] = $displayed_sessions;

		}


				
		
		if (ENVIRONMENT == 'development') {
			$results['query'] = $params;
		}
		return $results;
	
	}

	function getAutoComplete($search, $range, $apps)
	{

		$params = [
			"body" => [
				"size" => 0,
				"aggs" => [
					"autocomplete" => [
						"terms" => [
							"field" => "_all",
							"size" => 5,
							"include" => [
								"pattern" => $search . '.*'
							]
						]
					]
				],
				"query" => [
					'bool' => [
						'must' => [
							[
								"prefix" => [
									"_all" => [
										"value" => $search
									]
								]
							],
						]
					]

				]
			]
		];

		$params['timeout'] = $this->config->item('timeout');

		$params = append_range_query($params, $range);
		$params = append_application_query($params, $apps);

		$result = $this->elasticClient->search($params);


		$data = [];
		if (!empty($result) && isset($result['aggregations']['autocomplete'])) {

			foreach ($result['aggregations']['autocomplete']['buckets'] as $bucket) {
				$data[] = $bucket['key'];
			}

		}
		return $data;


	}

}

?>
