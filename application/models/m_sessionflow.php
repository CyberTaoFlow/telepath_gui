<?php

class M_Sessionflow extends CI_Model {
	
	function __construct() {
		parent::__construct();
		$this->elasticClient = new Elasticsearch\Client();
	}
	
	public function get_sessionflow_params($uid) {
		
		$params['body'] = array(
			'size'  => 1,
			'query' => array(
				'bool' => array(
					'filter' => array(
						array('query_string' => array('default_field' => '_id', 'query' => $uid)),
					)
				)
			)
		);
		
		$results = $this->elasticClient->search($params);
		$results = get_elastic_results($results);
//		$params = array();
//		# Make sure we do not have XSS kind of security bug in HTML headers, Yuli
//		Now, we escape html in JS (Yossi)
//		if ($results && isset($results[0]['parameters']))
//		{
//			foreach ($results[0]['parameters'] as $p)
//			{
//				if (!empty($p['value']))
//				{
//					$p['value'] = @htmlspecialchars($p['value'], ENT_QUOTES);
//				}
//				if (!empty($p['name']))
//				{
//					$p['name']  = @htmlspecialchars($p['name'],  ENT_QUOTES);
//				}
//				$params[] = $p;
//			}
//			$results[0]['parameters'] = $params;
//		}

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
	
	public function get_session_stats($anchor_field, $anchor_value, $key = '',$state='', $range = null,
		$suspect_threshold = 0.8) {
		if ($range) {
			$params['index'] = $range['indices'];
		} else {
			$params['index'] = 'telepath-20*';
		}
		$params['type'] = 'http';
        $suspect_count = 0;
        $search_count =0;
		if ($key || $state)
		{	
			$params['body'] = [
				'size' => 0,
				'query' => [
					'bool' => [
						'filter' => [
//							[ 'term' => [ '_type' => 'http' ] ],
							[ 'term' => [$anchor_field => $anchor_value] ],
							#[ 'range' => [ 'ts' => [ 'gte' => intval($settings['range']['start']), 'lte' => intval($settings['range']['end']) ] ] ],
//							[ 'query_string' => [ "query" => $key, "default_operator" => 'AND' ] ]
                        	                ]
					],
				],
			];
            if ($state=='Suspect'){
				$params['body']['query']['bool']['filter'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
				$params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts' ] ];
				$params['body']['query']['bool']['must_not'][] =  [ 'match' => [ 'operation_mode' => '1' ] ];

				$results = $this->elasticClient->search($params);

				$suspect_count = $results['hits']['total'];
            }
            if ($key){
				// empty body to get results matching search key only
				$params['body'] =  [];
				$params['body']['query']['bool']['filter'][] =  [ 'term' => [$anchor_field => $anchor_value] ];

				$params = append_range_query($params, $range);

				$params['body']['query']['bool']['filter'][] =  [ 'query_string' => [ "query" => $key, "default_operator" => 'AND' ] ];

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
		}

		$params['body'] = [
			'size'  => 0,
			"aggs" => [
				
				"score_average" => [
							"avg" => [ "field" => "score_average" ]
				],
				"score_query" => [
							"avg" => [ "field" => "score_query" ]
				],
				"score_landing" => [
							"avg" => [ "field" => "score_landing" ]
				],
				"score_geo" => [
							"avg" => [ "field" => "score_geo" ]
				],
				"score_flow" => [
							"avg" => [ "field" => "score_flow" ]
				],
				"alerts_count" => [
					"sum" => [ "field" => "alerts_count" ]
				],
				"business_actions_count" => [
					"sum" => [ "field" => "business_actions_count" ]
				],
				"ip_orig" =>[
					"terms" => [ "field" => "ip_orig" , "size" =>1]
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

		$params = append_range_query($params, $range);

		$results = $this->elasticClient->search($params);

		$params['body'] = [
			'size' => 0,
			'query' => [
				'bool' => [
					'filter' => [
						[ 'term' => ["ip_orig" => $results['aggregations']['ip_orig']['buckets'][0]['key']] ],

					]
				],
			],
			"aggs" =>[
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
				]
			]
		];

		$results2 = $this->elasticClient->search($params);

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
				"score_average" => $results['aggregations']['score_average']['value'],
				"score_query"   => $results['aggregations']['score_query']['value'],
				"score_landing" => $results['aggregations']['score_landing']['value'],
				"score_geo"     => $results['aggregations']['score_geo']['value'],
				"score_flow"    => $results['aggregations']['score_flow']['value'],
				"actions_count" => $results['aggregations']['business_actions_count']['value'],
				"alerts_count"  => $results['aggregations']['alerts_count']['value'],
				"session_start" => $results['aggregations']['min_ts']['value'],
				"session_end"   => $results['aggregations']['max_ts']['value'],
				'ip_score' => $results2['aggregations']['last_score']['buckets'][0]['key'],
				"search_count"  => $search_count,
				"suspect_count" => $suspect_count,
				"total" 	=> $results['hits']['total']
			);
		}
			
	}
	
	public function get_sessionflow($anchor_field, $anchor_value, $start, $limit, $filter, $key = null, $range =
	false, $suspect_threshold = 0.8) {
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
				$params['body']['query']['bool']['filter'][] =  [ 'exists' => [ 'field' => 'alerts' ] ] ;
			break;
			case 'Search':
				if ($key)
				{
					$params['body']['query']['bool']['filter'][] = [ 'query_string' => [ "query" => $key, "default_operator" => 'AND' ] ];
					break;
				}
            break;
            case 'Suspect':
                $params['body']['query']['bool']['filter'][] = [ 'range' => [ 'score_average' => [ 'gte' => $suspect_threshold ] ] ];
                $params['body']['query']['bool']['must_not'][] =  [ 'exists' => [ 'field' => 'alerts' ] ];
                $params['body']['query']['bool']['must_not'][] =  [ 'match' => [ 'operation_mode' => '1' ] ];
                break;
			default:
			case 'All':
				// Do nothing, no filter
			break;
		}

		$params = append_range_query($params, $range);
		$params = append_access_query($params);
		$results = get_elastic_results($this->elasticClient->search($params));

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
	
	public function get_RID_for_alert($alert_id) {
		
		$this->db->select('RID');
		$this->db->from('alerts_merge, session_alerts');
		$this->db->where('alerts_merge.SID = session_alerts.SID');
		$this->db->where('alerts_merge.rule_group = session_alerts.rule_group');
		$this->db->where('alerts_merge.id', $alert_id);
		$this->db->order_by('session_alerts.date ASC');
		$this->db->limit(1);
		$RID = $this->db->get()->row_array();
		
		return $RID['RID'];
	
	}
		
	public function get($RID) {
	
			
	}
	
	public function get_params($sid, $RIDS, $epoch) {
		
		$ans    = array();
		
		// convert to array
		$RIDS = explode(',', $RIDS);
		
		$this->db->select('rule_group,alert_param_ids');
		$this->db->from('session_alerts,rule_groups');
		$this->db->where('sid', $sid);
		$this->db->where('session_alerts.rule_group=rule_groups.id', null, false);
		$query = $this->db->get();
		
		$rule = $query->result();

		$rule_group_id = $rule[0]->rule_group;
		$alert_param_ids = $rule[0]->alert_param_ids;
		
		if($alert_param_ids && strlen($alert_param_ids) > 0) {
			
			$this->load->model('AttributeScores');
		
			$alert_param_ids = explode(',', $alert_param_ids);
			
			foreach($RIDS as $RID) {
				
				$ans[$RID] = array();
				
				$params = $this->AttributeScores->get_specified_param_by_RIDs($alert_param_ids, $RID, true, $epoch, -1);
				
				if(!empty($params)) {
				
					foreach($params as $param) {
					
						$ans[$RID][] = array(
						
							'att_id'    => $param->att_id,
							'att_name'  => $param->att_name,
							'att_alias' => $param->att_alias,
							'val'       => $param->data,
							'mask'      => $param->mask
							
						);
					
					}
				
				} else {
				
					$this->db->distinct();
					$this->db->select('value,att_name,attributes.att_id,att_alias');
					$this->db->from('session_alerts,attributes');
					$this->db->where('attributes.att_id=session_alerts.att_id', null, false);
					$this->db->where('rule_group', $rule_group_id);
					$this->db->where('SID', $sid);
					$this->db->where('value !=', '');
					$query  = $this->db->get();
					$params = $query->result();
					
					if(!empty($params)) {
						
						foreach($params as $param) {
							
							$ans[$RID][] = array(
								'att_id'    => $param->att_id,
								'att_name'  => $param->att_name,
								'att_alias' => $param->att_alias,
								'val'       => $param->data
							);
							
						}
						
					}
					
				}
				
			}
			
		}
		
		return $ans;
	}

}

?>
