<?php

class M_Sessionflow extends CI_Model {
	
	function __construct() {

		parent::__construct();

	}
	
	public function get_sessionflow_params($uid) {

		$params['body'] = array(
			'size' => 1,
			'query' => [
				'bool' => [
					'filter' => [
						['term' => ['_id' => $uid]]
					]
				]
			]
		);

		$params['timeout'] = $this->config->item('timeout');
		
		$results = $this->elasticClient->search($params);
//		$results = get_elastic_results($results);
		$results = get_source($results);


/*		$params=[];
		$params['index'] = 'telepath-20*';
		$params['type'] = 'http';
		$params['body']=[
			'size'=>1,
			"sort"=>[
				"ts"=>[
				"order"=>"desc"
				]
			],
			'query'=>[
				'filtered'=> [
				'filter'=>[
					'term'=>[
						'sid'=>$results[0]['sid']
						]
					]
				]
			]
		];
		$results2 = $this->elasticClient->search($params);
		$results2 = get_elastic_results($results2);
		$results[0]['ip_score']=$results2[0]['ip_score'];*/
		return $results[0];
	
	}
	
	public function get_session_stats($anchor_field, $anchor_value, $key = '', $fields = [], $range = null,
		$suspect_threshold = 0.8) {
		if ($range) {
			$params['index'] = $range['indices'];
		} else {
			$params['index'] = 'telepath-20*';
		}
		$params['type'] = 'http';
        $search_count =0;

		$params['body'] = [
			'size' => 0,
			'query' => [
				'bool' => [
					'filter' => [
//							[ 'term' => [ '_type' => 'http' ] ],
						['term' => [$anchor_field => $anchor_value]],
						#[ 'range' => [ 'ts' => [ 'gte' => intval($settings['range']['start']), 'lte' => intval($settings['range']['end']) ] ] ],
//							[ 'query_string' => [ "query" => $key, "default_operator" => 'AND' ] ]
					]
				],
			],
		];

		$params['body']['query']['bool']['filter'][] = ['range' => ['score_average' => ['gte' => $suspect_threshold]]];
		$params['body']['query']['bool']['must_not'][] = ['exists' => ['field' => 'alerts_count']];
		$params['body']['query']['bool']['must_not'][] = ['match' => ['operation_mode' => '1']];
		$params = append_range_query($params, $range);
		$params['timeout'] = $this->config->item('timeout');

		$results = $this->elasticClient->search($params);

		$suspect_count = $results['hits']['total'];

		if ($key) {
			// empty body to get results matching search key only
			$params['body'] = [];
			$params['body']['query']['bool']['filter'][] = ['term' => [$anchor_field => $anchor_value]];

			$params = append_range_query($params, $range);

			$params['body']['query']['bool']['filter'][] = [
				'query_string' => [
					"fields" => $fields,
					"query" => $key,
					"default_operator" => 'AND',
					"analyzer" => "search-analyzer",
					"lenient" => true
				]
			];
			$params['timeout'] = $this->config->item('timeout');

			$results = $this->elasticClient->search($params);

			$search_count = $results['hits']['total'];
		}


			/*$results = $this->elasticClient->search($params);

            if ($key && $state=='Suspect'){
                $search_count = $results['hits']['total'];
				$suspect_count = $results['hits']['total'];
            }
            elseif ($state=='Suspect'){
                $suspect_count = $results['hits']['total'];
            }
            else{
                $search_count = $results['hits']['total'];
            }*/


		$params['body'] = [
			'size'  => 0,
			"aggs" => [

				"alerts_count" => [
					"sum" => [ "field" => "alerts_count" ]
				],
				"business_actions_count" => [
					"sum" => [ "field" => "business_actions_count" ]
				],
				/*"last_score" => [
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
				],*/
				"min_ts" => [ "min" => [ "field" => "ts" ] ],
				"max_ts" => [ "max" => [ "field" => "ts" ] ]
				
			],
			'query' => array(
				'bool' => array(
					'filter' => array(
						[ 'term' => [$anchor_field => $anchor_value] ],
					)
				)
			)
		];

		$params['timeout'] = $this->config->item('timeout');

		$params = append_range_query($params, $range);

		$results = $this->elasticClient->search($params);


		if(isset($results['aggregations'])) {
			if (!empty($range))
			{
				if (intval($range['start']) > $results['aggregations']['min_ts']['value'])
				{
					$results['aggregations']['min_ts']['value'] = intval($range['start']);
				}
				if ($results['aggregations']['max_ts']['value'] > intval($range['end']))
				{
					$results['aggregations']['max_ts']['value'] = intval($range['end']);
				}
			}
			return array(
				"actions_count" => $results['aggregations']['business_actions_count']['value'],
				"alerts_count"  => $results['aggregations']['alerts_count']['value'],
				"session_start" => $results['aggregations']['min_ts']['value'],
				"session_end"   => $results['aggregations']['max_ts']['value'],
				"search_count"  => $search_count,
				"suspect_count" => $suspect_count,
				"total" 	=> $results['hits']['total']
			);
		}
			
	}


	public function get_session_scores($anchor_field, $anchor_value)
	{

		$params['index'] = 'telepath-20*';
		$params['type'] = 'http';
		$params['body'] = [
			'size' => 0,
			"aggs" => [

				"score_average" => [
					"avg" => ["field" => "score_average"]
				],
				"score_query" => [
					"avg" => ["field" => "score_query"]
				],
				"score_landing" => [
					"avg" => ["field" => "score_landing"]
				],
				"score_geo" => [
					"avg" => ["field" => "score_geo"]
				],
				"score_flow" => [
					"avg" => ["field" => "score_flow"]
				],
				/*"last_score" => [
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
				],*/
				"ip_orig" => [
					"terms" => ["field" => "ip_orig", "size" => 1]
				],
			],
			'query' => array(
				'bool' => array(
					'filter' => array(
						['term' => [$anchor_field => $anchor_value]],
					)
				)
			)
		];

		$params['timeout'] = $this->config->item('timeout');

		$results = $this->elasticClient->search($params);

		if (isset($results['aggregations']) && isset($results['aggregations']['ip_orig'])
			&& !empty($results['aggregations']['ip_orig']['buckets'])
		) {

			$params['body'] = [
				'size' => 0,
				'query' => [
					'bool' => [
						'filter' => [
							['term' => ["ip_orig" => $results['aggregations']['ip_orig']['buckets'][0]['key']]],
						]
					],
				],
				"aggs" => [
					"last_score" => [
						"terms" => [
							"field" => "ip_score",
							"size" => 1,
							"order" => ["max_ts" => "desc"]
						],
						'aggs' => [
							'max_ts' => [
								"max" => ["field" => "ts"]
							]
						]
					]
				]
			];

			$params['timeout'] = $this->config->item('timeout');

			$results2 = $this->elasticClient->search($params);
		}

		if (!empty($results['aggregations'])) {
			$scores = [
				"score_query" => $results['aggregations']['score_query']['value'],
				"score_landing" => $results['aggregations']['score_landing']['value'],
				"score_geo" => $results['aggregations']['score_geo']['value'],
				"score_flow" => $results['aggregations']['score_flow']['value'],
			];
		}

		if (isset($results2['aggregations']) && isset($results2['aggregations']['last_score']) && !empty
			($results2['aggregations']['last_score']['buckets'])
		) {

			$scores['ip_score'] = $results2['aggregations']['last_score']['buckets'][0]['key'];
		}

		return $scores;


	}

	public function get_sessionflow($anchor_field, $anchor_value, $start, $limit, $filter, $key = null, $fields = [],
		$range = false, $suspect_threshold = 0.8) {

		if($range){
			$params['index'] = $range['indices'];
		}
		else{
			$params['index'] = 'telepath-20*';
		}
		$params['type'] = 'http';
		$params['body'] = array(
			'size'  => $limit,
			'from' => $start,
			'query' => [
				'bool' => [
					'filter' => [
						['term' => [$anchor_field => $anchor_value]],
					]
				]
			],
			"sort" => [
				[ "ts" => [ "order" => "asc","unmapped_type" => "long"] ]
			]
		);
		
		switch($filter) {
			case 'Actions':
				$params['body']['query']['bool']['filter'][] =  [ 'exists' => [ 'field' => 'business_actions' ] ] ;
			break;
			case 'Alerts':
				$params['body']['query']['bool']['filter'][] =  [ 'exists' => [ 'field' => 'alerts_count' ] ] ;
			break;
			case 'Search':
				if ($key) {
					$params['body']['query']['bool']['filter'][] = [
						'query_string' => [
							"fields" => $fields,
							"query" => $key,
							"default_operator" => 'AND',
							"analyzer" => "search-analyzer",
							"lenient" => true
						]
					];
					break;
				}
            break;
            case 'Suspects':
                $params['body']['query']['bool']['filter'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
                $params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts_count' ] ];
                $params['body']['query']['bool']['must_not'][] =  [ 'match' => [ 'operation_mode' => '1' ] ];
                break;
			default:
			case 'All':
				// Do nothing, no filter
			break;
		}

		$params['timeout'] = $this->config->item('timeout');

		$params = append_range_query($params, $range);
		$params = append_access_query($params);
		$results = get_source_and_ip($this->elasticClient->search($params));

/*		$params2['index'] = 'telepath-20*';
		$params2['type'] = 'http';
		$params2['body']=[
			'size'=>1,
			'sort'=>[
				'ts'=>['order'=>'desc']],
			'query'=>[
				'filtered'=>['filter'=>['term'=>[$anchor_field => $anchor_value]]]]];

		$results2 = $this->elasticClient->search($params2);

		$results2 = get_elastic_results($results2);

		foreach ($results as $key => $value){
			$results[$key]['ip_score']= $results2[0]['ip_score'];
		}*/
		return $results;

	}
	

		


}

?>
