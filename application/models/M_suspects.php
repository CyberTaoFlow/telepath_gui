<?php

class M_Suspects extends CI_Model {
	
	function __construct() {
	
		parent::__construct();

	}

	public function get_threshold()
	{

//		$params['index'] = 'telepath-20*';
//		$params['type'] = 'http';
//		$params['body'] = [
//			'size' => 0,
//			"aggs" => [
//				"grades_stats" => [
//					"extended_stats" => ["field" => "score_average", "sigma" => 3]
//				]
//			],
//			'query' => [
//				'bool' => [
//					'must_not' => [
//						["match" => ['operation_mode' => '1']]
//					]
//				]
//			]
//		];
//
//		$result = $this->elasticClient->search($params);
//
//		if (isset($result["aggregations"]) &&
//			isset($result["aggregations"]["grades_stats"]) &&
//			isset($result["aggregations"]["grades_stats"]["std_deviation_bounds"]) &&
//			isset($result["aggregations"]["grades_stats"]["std_deviation_bounds"]["upper"]) &&
//			!empty($result["aggregations"]["grades_stats"]["std_deviation_bounds"]["upper"])
//		) {
//			return $result["aggregations"]["grades_stats"]["std_deviation_bounds"]["upper"];
//		} else {
//			return 0.85;
//		}
		return 0.80;

	}

	public function get($range, $apps, $sort, $sortorder, $displayed = false, $limit = 100, $suspect_threshold, $search = '') {

		$sortfield = 'count';

		// fix undefined variabale (Yuli)
		$count = 0;

		switch ($sort) {
			case 'date':
				$sortfield = 'date';
				break;
			case 'count':
//			case 'score':
				$sortfield = '_count';
				break;
//			case 'alerts':
//				$sortfield = 'alerts_count';
//			break;
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
					"terms" => ["field" => "sid", "size" => $limit, "order" => [$sortfield => strtolower($sortorder)]],
					"aggs" => [
						"score_average" => [
							"avg" => ["field" => "score_average"]
						]
					]
				],
				"sid_count" => [
					"cardinality" => ["field" => "sid"],
				]
			],
		];


		if ($displayed) {
			$params['body']['query']['bool']['must_not'][] = ['terms' => ['sid' => $displayed]];
		}


		if ($sortfield == "date") {
			$params['body']["aggs"]["sid"]["aggs"]["date"] = ["max" => ["field" => "ts"]];
		}
//		else if ($sortfield == "alerts_count")
//		{
//			$params['body']["aggs"]["sid"]["aggs"] = [ "alerts_count" => [ "sum" => [ "field" => "alerts_count" ] ] ];
//		}
//		$params['body']["aggs"]["sid"]["aggs"] = [ "cases_count" => [ "sum" => [ "field" => "cases_count" ] ] ];

		$params['body']['query']['bool']['filter'][] = ['range' => ['score_average' => ['gte' => $suspect_threshold]]];
		$params['body']['query']['bool']['must_not'][] = ['exists' => ['field' => 'alerts_count']];
		$params['body']['query']['bool']['must_not'][] = ['match' => ['operation_mode' => '1']];

		$params = append_range_query($params, $range);

		if ($search && strlen($search) > 1) {
			$params['body']['query']['bool']['filter'][] = [
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
					"query" => $search,
					"default_operator" => 'AND',
					"lenient" => true
				]
			];
		}

		$params['timeout'] = $this->config->item('timeout');

		$params = append_application_query($params, $apps);
		$params = append_access_query($params);

		$result = $this->elasticClient->search($params);


		$sid_buckets = false;


		if (isset($result["aggregations"]) &&
			isset($result["aggregations"]["sid"]) &&
			!empty($result["aggregations"]["sid"]["buckets"])
		) {

			$sid_buckets = $result["aggregations"]["sid"]["buckets"];
		}

		if ($sid_buckets) {
			foreach ($sid_buckets as $sid) {

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
						"country_code" => [
							"terms" => ["field" => "country_code", "size" => 1]
						],
						"city" => [
							"terms" => ["field" => "city", "size" => 1]
						],
						"ip_orig" => [
							"terms" => ["field" => "ip_orig", "size" => 1]
						],
						"host" => [
							"terms" => ["field" => "host", "size" => 100]
						],
						"cases_count" => [
							"sum" => ["field" => "cases_count"]
						],
						"cases_names" => [
							"terms" => ["field" => "cases_name", "size" => 10]
						],
						"actions_count" => [
							"sum" => ["field" => "business_actions_count"]
						],
						"actions_names" => [
							"terms" => ["field" => "business_actions.name", "size" => 10]
						],
						"date" => [
							"max" => ["field" => "ts"]
						],
						"user" => [
							"terms" => [
								"field" => "username",
								"order" => ["_term" => "desc"],
								"size" => 1
							]
						],
						/*"last_score" => [
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

				$params2['body']['query']['bool']['filter'][] = ['term' => ['sid' => $sid['key']]];
				$params2['body']['query']['bool']['filter'][] = ['range' => ['score_average' => ['gte' => $suspect_threshold]]];
				$params2['body']['query']['bool']['must_not'][] = ['exists' => ['field' => 'alerts_count']];
				$params2['body']['query']['bool']['must_not'][] = ['match' => ['operation_mode' => '1']];
				$params2['timeout'] = $this->config->item('timeout');

				$params2 = append_range_query($params2, $range);

				$result2 = $this->elasticClient->search($params2);
				$sid = $result2['aggregations'];
				if (count($sid['city']['buckets']) > 0) {
					$results['items'][] = array(
						"sid" => $sid_key,
						"city" => $sid['city']['buckets'][0]['key'],
						"cases_count" => $sid['cases_count']['value'],
						"cases_names" => $sid['cases_names']['buckets'],
						"country" => $sid['country_code']['buckets'][0]['key'],
						"ip_orig" => $sid['ip_orig']['buckets'][0]['key'],
						"host" => $sid['host']['buckets'],
						"count" => $doc_count,
						"actions_count" => $sid['actions_count']['value'],
						"actions_names" => $sid['actions_names']['buckets'],
						"date" => $sid['date']['value'],
						"score_average" => $score_average,
						"user" => $sid['user']['buckets'][0]['key']
					);

				} else {
					// can not return record details here !!!
				}


			}

			$count = $result["aggregations"]["sid_count"]["value"];

		}


		$results['count'] = $count;
		if (ENVIRONMENT == 'development') {
			$results['query'] = $params;
			$results['std'] = $suspect_threshold;
		}
		return $results;



	}

	public function dashboard_get($range, $apps, $sort, $sortorder, $limit, $suspect_threshold, $exclude_ips)
	{

		$sortfield = 'count';

		switch ($sort) {
			case 'date':
				$sortfield = 'date';
				break;
			case 'count':
//			case 'score':
				$sortfield = '_count';
				break;
//			case 'alerts':
//				$sortfield = 'alerts_count';
//			break;
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
					"terms" => [
						"field" => "sid",
						"size" => $limit * 2, // Get more sessions to return distinct IPs
						"order" => [
							$sortfield => strtolower($sortorder)
						]
					],
					"aggs" => [
						"country_code" => [
							"terms" => ["field" => "country_code", "size" => 1]
						],
						"ip_orig" => [
							"terms" => ["field" => "ip_orig", "size" => 1]
						],
						"host" => [
							"terms" => ["field" => "host", "size" => 100]
						],
						"score_average" => [
							"avg" => ["field" => "score_average"]
						],
						"date" => [
							"max" => ["field" => "ts"]
						],
						"user" => [
							"terms" => [
								"field" => "username",
								"order" => ["_term" => "desc"],
								"size" => 1
							]
						],
					],
				],

			],
		];


		$params['body']['query']['bool']['filter'][] = ['range' => ['score_average' => ['gte' => $suspect_threshold]]];
		$params['body']['query']['bool']['must_not'][] = ['exists' => ['field' => 'alerts_count']];
		$params['body']['query']['bool']['must_not'][] = ['match' => ['operation_mode' => '1']];

		if (!empty($exclude_ips)) {
			$params['body']['query']['bool']['must_not'][] = ['terms' => ['ip_orig' => $exclude_ips]];
		}

		$params['timeout'] = $this->config->item('timeout');


		$params = append_range_query($params, $range);
		$params = append_application_query($params, $apps);
		$params = append_access_query($params);

		$result = $this->elasticClient->search($params);

		$results = [];

		if (isset($result["aggregations"]) &&
			isset($result["aggregations"]["sid"]) &&
			!empty($result["aggregations"]["sid"]["buckets"])
		) {

			$ips = [];
			foreach ($result["aggregations"]["sid"]["buckets"] as $sid) {

				// Return only the number of sessions requested
				if (sizeof($ips) > $limit - 1) {
					break;
				}

				$ip = $sid['ip_orig']['buckets'][0]['key'];

				// Return only distinct IPs
				if (in_array($ip, $ips)) {
					continue;
				}

				$results['items'][] = array(
					"sid" => $sid['key'],
					"country" => $sid['country_code']['buckets'][0]['key'],
					"ip_orig" => $ip,
					"host" => $sid['host']['buckets'],
					"count" => $sid['doc_count'],
					"date" => $sid['date']['value'],
					"user" => $sid['user']['buckets'][0]['key'],
					"score_average" => $sid['score_average']['value']
				);
				$ips[] = $ip;

			}

			$results['ips'] = $ips;
		}


		if (ENVIRONMENT == 'development') {
			$results['query'] = $params;
			$results['std'] = $suspect_threshold;
		}
		return $results;

	}



}

?>
