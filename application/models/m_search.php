<?php

class M_Search extends CI_Model {
	
	function __construct() {
		parent::__construct();
		
		//$params = array();
		//$params['hosts'] = array ('127.0.0.1:9200');
// $params['logging'] = true;
// $params['logPath'] = '/tmp/elasticsearch.log';

		
		$this->elasticClient = new Elasticsearch\Client();
	}
	
	function search($scope, $settings) {
		
		$limit = 100;
		
		$params['body'] = [
			'size' => 0,
			"aggs" => [
				"sid" => [ 
				
					"terms" => [ "field" => "sid", "size" => $limit, "order" => [ 'date' => 'DESC' ] ],
					"aggs" => [
						/*"country_code" => [ 
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
						"alerts_names" => [
							"terms" => [ "field" => "alerts.name", "size" => 100 ]
						],
						"business_actions_count" => [
							"sum" => [ "field" => "business_actions_count" ]
						],
						"business_actions_names" => [
							"terms" => [ "field" => "business_actions.name", "size" => 100 ]
						],
						"score" => [
							"avg" => [ "field" => "score_average" ]
						],*/
						"date" => [
							"max" => [ "field" => "ts" ]
						],
					],
				
				],
				"sid_count" => [
					"cardinality" => [ "field" => "sid" ],
				]
			],
			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'http' ] ],
						[ 'range' => [ 'ts' => [ 'gte' => intval($settings['range']['start']), 'lte' => intval($settings['range']['end']) ] ] ],
						[
                            'query_string' => [
                                "query" => $settings['search']
                            ] 
                        ]
					]
				],
			],
		];
		
		$this->load->model('M_Suspects');
		$suspect_threshold = $this->M_Suspects->get_threshold();
		
		$params2 = array();
		switch($scope) {
			case 'alerts':
				$params['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
				$params2['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
			break;
			case 'cases':
				// Here we also need cases data
				$params['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'cases' ] ] ] ];
				$params['body']["aggs"]["sid"]["aggs"]["cases_names"] = [ "terms" => [ "field" => "cases.name", "size" => 100 ] ];
				$params['body']["aggs"]["sid"]["aggs"]["cases_count"] = [ "sum" => [ "field" => "cases_count" ] ];
				$params2['body']['query']['bool']['must'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'cases' ] ] ] ];
				$params2['body']["aggs"]["sid"]["aggs"]["cases_names"] = [ "terms" => [ "field" => "cases.name", "size" => 100 ] ];
				$params2['body']["aggs"]["sid"]["aggs"]["cases_count"] = [ "sum" => [ "field" => "cases_count" ] ];
			break;
			case 'suspects':
				$params['body']['query']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
				$params['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
				$params2['body']['query']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
				$params2['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
			break;
			case 'requests':
				// old method
				$params['body']['query']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
				$params['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
				$params2['body']['query']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
				$params2['body']['query']['bool']['must_not'][] = [ 'filtered' => [ 'filter' => [ 'exists' => [ 'field' => 'alerts' ] ] ] ];
				// new method !!!
/*
                                $params['body']['query']['filtered']['filter']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
                                $params['body']['query']['filtered']['filter']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts' ] ];
                                $params2['body']['query']['filtered']['filter']['bool']['must'][] = [ 'range' => [ 'score_average' => [ 'lt' => $suspect_threshold ] ] ];
                                $params2['body']['query']['filtered']['filter']['bool']['must_not'][] =  ['exists' =>  [   'field' => 'alerts'  ] ];
*/
			break;
		}
	
		$params2['body'] = [
			'size' => 0,
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
				"alerts_names" => [
					"terms" => [ "field" => "alerts.name", "size" => 100 ]
				],
				"business_actions_count" => [
					"sum" => [ "field" => "business_actions_count" ]
				],
				"business_actions_names" => [
					"terms" => [ "field" => "business_actions.name", "size" => 100 ]
				],
				"score" => [
					"avg" => [ "field" => "score_average" ]
				],
				"date" => [
					"max" => [ "field" => "ts" ]
				],
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
				]

			]
		];

		//var_dump($settings['apps']);
		$params = append_application_query($params, $settings['apps']);	
		//var_dump(json_encode($params));
		$result = $this->elasticClient->search($params);
		$results = array('items' => array());
		
		if(isset($result["aggregations"]) && 
		   isset($result["aggregations"]["sid"]) && 
		   isset($result["aggregations"]["sid"]["buckets"]) && 
		   !empty($result["aggregations"]["sid"]["buckets"])) {
		   
				$sid_buckets = $result["aggregations"]["sid"]["buckets"];
				foreach($sid_buckets as $sid) {
		
					$sid_key = $sid['key'];
					$doc_count = $sid['doc_count'];
					if($scope == 'cases') {
						$cases_count_ = $sid['cases_count']['value'];					
						$cases_names_buckets = $sid['cases_names']['buckets'];
					}

					$params3 = $params2;
					
					$params3['body']['query']['bool']['must'][] = [ 'term' => ['sid' => $sid['key'] ] ];
					$params3['body']['query']['bool']['must'][] = [ 'term' => ['_type' => 'http' ] ];
					$params3['body']['query']['bool']['must'][] = [ 'range' => [ 'ts' => [ 'gte' => intval($settings['range']['start']), 'lte' => intval($settings['range']['end']) ] ] ];
					$params3['body']['query']['bool']['must'][] = [ 'query_string' => [ "query" => $settings['search'] ] ];

					$result2 = $this->elasticClient->search($params3);
					$sid = $result2['aggregations'];

					$item = array(
						"sid"     => $sid_key, 
						"city"    => $sid['city']['buckets'][0]['key'], 
						"alerts_count"  => $sid['alerts_count']['value'], 
						"alerts_names"  => $sid['alerts_names']['buckets'],
						"actions_count"  => $sid['business_actions_count']['value'], 
						"actions_names"  => $sid['business_actions_names']['buckets'],  
						"country" => strtoupper($sid['country_code']['buckets'][0]['key']),
						"ip_orig" => long2ip($sid['ip_orig']['buckets'][0]['key']),
						"host"    => $sid['host']['buckets'],
						"count"   => $doc_count,
						"score_average" => $sid['score']['value'],
						"date"  => $sid['date']['value'],
						"ip_score"=>$sid['last_score']['buckets'][0]['key']
					);
					if($scope == 'cases') {
						$item["cases_count"] = $cases_count_;
						$item["cases_names"] = $cases_names_buckets;
					}					
				
					$results['items'][] = $item;
					
				}
				
				$results['total'] = $result["aggregations"]["sid_count"]["value"];
				
		}
				
		
		$results['success'] = true;
		$results['query']   = $params;
		return $results;
	
	}
	

}

?>
