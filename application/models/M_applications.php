<?php
	
class M_Applications extends CI_Model {
	
	function __construct() {

		parent::__construct();

	}

	/*function set($data) {

		// Check

		$params['body'] = [
			'size'   => 1,

			'query' => [
				'bool' => [
					'must' => [
						[ 'term' => [ '_type' => 'application' ] ],
						[ 'term' => [ "host" => $data['host'] ] ],
					]
				]
			]

		];

		$results = $this->elasticClient->search($params);
		$exists  = intval($results['hits']['total']) > 0;

		// Prep

		$params = array();
		$params['index'] = 'telepath-applications';
		$params['type']  = 'application';
		$params['id']    = $data['host'];

		// Cleanup certs if ssl was disabled
		if(intval($data['ssl_flag']) == 0) {
			$data['app_ssl_certificate'] = '';
			$data['app_ssl_private'] = '';
			$data['ssl_data'] = [];
		}

		if(isset($data['app_ssl_certificate']) && $data['app_ssl_certificate'] != '') {
			$cert_data = openssl_x509_parse($data['app_ssl_certificate']);
			$data['ssl_data'] = $cert_data;
		}

		if(!$exists) {

			// Create
			$params['body']  = $data;
			$ret =  $this->elasticClient->index($params);

		} else {

			// Update
			$params['body']  = [ 'doc' => $data ];
			$ret =  $this->elasticClient->update($params);

		}

		$this->elasticClient->indices()->refresh(array('index' => 'telepath-applications'));

	}*/


	function set($data) {

		// Check

		$params['index'] ='telepath-domains';
		$params['type'] = 'domains';
		$params['id']=$data['host'];


		$exists = $this->elasticClient->exists($params);

		// Cleanup certs if ssl was disabled
		if(intval($data['ssl_flag']) == 0) {
			$data['app_ssl_certificate'] = '';
			$data['app_ssl_private'] = '';
			$data['ssl_server_port'] = '';
			$data['ssl_data'] = [];
		}

		if(isset($data['app_ssl_certificate']) && $data['app_ssl_certificate'] != '') {
			$cert_data = openssl_x509_parse($data['app_ssl_certificate']);
			$data['ssl_data']['subject'] = $cert_data['subject'];
		}


		// check if document exist to not delete the cookie suggestion added by the engine
		if ($exists){
			$params['body']['doc']=$data;
			$this->elasticClient->update($params);
		}
		else{
			$params['body']=$data;
			$this->elasticClient->index($params);
		}
	// Prep

	/*	$params = array();
		$params['index'] = 'telepath-domains';
		$params['type']  = 'domains';
//		$params['id']    = $results['hits']['hits'][0]['_id'];

		// Cleanup certs if ssl was disabled


		if(!$exists) {

			// Create
//			$params['id'] =null;
			$params['body']  = $data;
			$ret =  $this->elasticClient->index($params);

		} else {

			// Update
			$params['id']    = $results['hits']['hits'][0]['_id'];
			$params['body']  = [ 'doc' => $data ];
			$ret =  $this->elasticClient->update($params);

		}*/

		$this->elasticClient->indices()->refresh(array('index' => 'telepath-domains'));

	}

	# Delete host from the application index
	function delete_from_app_domain($host) {
		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
		$params['id'] = $host;
		$exists = $this->elasticClient->exists($params);

		if ($exists){
			$this->elasticClient->delete($params);
//			$this->elasticClient->indices()->refresh(array('index' => 'telepath-domains'));
		}
	}

	# Delete all records where HTTP host used the same $host
	function delete_from_indices($host){
		$params = array();
		$params['index'] = 'telepath-20*';
		$params['type'] = 'http';
		$params['body']['query']['bool']['filter']['term']['host'] = $host;
		$this->elasticClient->deleteByQuery($params);
	}

	function update_flag($host)
	{
		$redisObj = new Redis();
		$redisObj->connect('localhost', '6379');
		return $redisObj->lpush("D", $host);
	}

	function get($host)
	{

		// Check
		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
		$params['id'] = $host;


		// now the hoxt name is the document id, so we don't need to search.
		/*	$params['body'] = [
                'size'   => 1,
                    'query' => [ "match" => [
                         "host" => $host
                    ]
                    ]
            ];

            $results = $this->elasticClient->search($params);*/


		$exists = $this->elasticClient->exists($params);

		//$exists  = @intval($results['hits']['total']) > 0;
		if (!$exists) {
			$app['AppCookieName'] = '';
			$app['app_ips'] = '';
			$app['operation_mode'] = '';
			$app['move_to_production'] = '';
			$app['eta'] = '';
//			$app['form_authentication_redirect_response_range'] = '';
			$app['host'] = $host;
			$app['cookie_suggestion'] = ['PHPSESSID', 'PHPSESSIONID', 'JSESSIONID', 'ASPSESSIONID', 'ASP.NET_SessionId', 'VisitorID', 'SESS'];
			$app['ssl_flag'] = 0;
			$app['app_ssl_certificate'] = '';
			$app['app_ssl_private'] = '';
			$app['ssl_server_port'] = '';
			$app['ssl_data'] = [];
		} else {

			$results = $this->elasticClient->get($params);

			$app = $results['_source'];


//		if(!isset($app['cookie_suggestion'])) { $app['cookie_suggestion'] = ''; }
			if (!isset($app['AppCookieName'])) {
				$app['AppCookieName'] = '';
			}
			if (!isset($app['app_ips'])) {
				$app['app_ips'] = '';
			}
			if (!isset($app['operation_mode'])) {
				$app['operation_mode'] = '';
			}
			if (!isset($app['move_to_production'])) {
				$app['move_to_production'] = '';
			}
			if (!isset($app['eta'])) {
				$app['eta'] = '';
			}
			if (!isset($app['ssl_flag'])) {
				$app['ssl_flag'] = 0;
			}
			if (!isset($app['app_ssl_certificate'])) {
				$app['app_ssl_certificate'] = '';
			}
			if (!isset($app['app_ssl_private'])) {
				$app['app_ssl_private'] = '';
			}
			if (!isset($app['ssl_server_port'])) {
				$app['ssl_server_port'] = '';
			}
//			if (!isset($app['form_authentication_redirect_response_range'])) {
//				$app['form_authentication_redirect_response_range'] = '';
//			}
			if (isset($app['cookie_suggestion'])) {
				if (is_array($app['cookie_suggestion']))
					array_push($app['cookie_suggestion'], 'PHPSESSID', 'PHPSESSIONID', 'JSESSIONID', 'ASPSESSIONID', 'ASP.NET_SessionId', 'VisitorID', 'SESS');
				else
					$app['cookie_suggestion'] = array($app['cookie_suggestion'], 'PHPSESSID', 'PHPSESSIONID', 'JSESSIONID', 'ASPSESSIONID', 'ASP.NET_SessionId', 'VisitorID', 'SESS');

			} else {
				$app['cookie_suggestion'] = ['PHPSESSID', 'PHPSESSIONID', 'JSESSIONID', 'ASPSESSIONID', 'ASP.NET_SessionId', 'VisitorID', 'SESS'];
			}

		}

		$app['ip_suggestion'] = $this->get_ip_suggestion($host);


		return $app;

	}

	function get_ip_suggestion($host){

		$params = [
			'index' => 'telepath-20*',
			'body' => [
				'size'  => 0,
				'aggs'  => [ 'ip_resp' => [ "terms" => [ "field" => "ip_resp" ], ], ],
				'query'=>['match'=>['host'=>$host]]
		]
		];

		$params['timeout'] = $this->config->item('timeout');


		$result = $this->elasticClient->search($params);

		if(!empty($result) && isset($result['aggregations'])) {
			$results = $result['aggregations']['ip_resp']['buckets'];

			$ip_suggestion = [];

			foreach ($results as $res) {
				array_push($ip_suggestion, $res['key']);
			}

			return $ip_suggestion;
		}
		return false;
	}

	//new function
//curl -XGET 'http://localhost:9200/telepath-20*/_search?pretty' -d '{"size":0,"aggs":{"host":{"terms":{"field":"host","size":999},"aggs":{"ip_resp":{"terms":{"field":"ip_resp"}}}}}}'
	
	function index($search = false, $learning_so_far=false, $sort, $dir, $size, $start=0 , $fields=["host.search", "subdomains",  'display_name'] ) {
		
		// Search specific records first


//		$params = [
//			'index' => 'telepath-20*',
//			'body' => [
//				'size'=>0,
//				'aggs'  => [ 'host' => [ "terms" => [ "field" => "host", "size" => 999 ] ] ]
//			]
//		];

//		$params['body'] = array(
//			'size'  => 0,
//			'aggs'  => [ 'host' => [ "terms" => [ "field" => "host", "size" => 999 ], ], ],
//			'query' => [ 'bool' => [ "must" => [ [ 'term' => [ '_type' => 'http' ] ] ] ] ]
//		);

		if($learning_so_far){
            $include=["host","subdomains","learning_so_far", "display_name", "operation_mode", "low_requests"];
        }
		else{
			$include=["host","subdomains", "display_name", "operation_mode"];
		}


		$params = [
			'index' => 'telepath-domains',
			'type' => 'domains',
			'_source_include' => $include,
			'sort' => [$sort.':'.$dir],
			'body' => [
				'size'=>$size,
				'from'=>$start
			],
		];

		if ($search){
			$params['body']['query']['bool']['filter'][] = [ "query_string" => [ "fields" => $fields , "query" => '*' . $search . '*' ] ];
			$params['body']['highlight']['fields'] = [ 'subdomains'=> new \stdClass() ];
		}

		$params['timeout'] = $this->config->item('timeout');

		$res=$this->elasticClient->search($params);

		// check if all the data is loaded
		if ($start + $size >= $res['hits']['total']) {
			$finished = true;
		} else {
			$finished = false;
		}
		$results = get_app_source($res,$learning_so_far);


//		$ans1 = [];
//		if(!empty($results)) {
//			foreach($results as $result) {
//				if(isset($result['host'])) {
//					$ans1[] = [ 'key' => $result['host'], 'hits' => 0 ];
//				}
//			}
//		}
//
//		return $ans1;
	/*	$params['body'] = [
			'size'  => 999,
			'query' => [ 'bool' => [ 'must' => [ [ 'term' => [ '_type' => 'application' ] ] ] ] ]
		];

		if($search) {
			$params['body']['query']['bool']['must'][] = [ "query_string" => [ "fields" => [ "host" ] , "query" => '*' . $search . '*' ] ];
		}

		$params = append_access_query($params);
		$results = get_elastic_results($this->elasticClient->search($params));

		$ans1 = [];
		if(!empty($results)) {
			foreach($results as $result) {
				if(isset($result['host'])) {
					$ans1[$result['host']] = [ 'key' => $result['host'], 'hits' => 0 ];
				}
			}
		}
		//sort($ans1);

		$params['body'] = array(
			'size'  => 0,
			'aggs'  => [ 'host' => [ "terms" => [ "field" => "host", "size" => 999 ], ], ],
			'query' => [ 'bool' => [ "must" => [ [ 'term' => [ '_type' => 'http' ] ] ] ] ]
		);

		if($search) {
			$params['body']['query']['bool']['must'][] = [ "query_string" => [ "fields" => [ "host" ] , "query" => '*' . $search . '*' ] ];
		}

		//var_dump(json_encode($params));
		//$params = append_access_query($params);
		$results = $this->elasticClient->search($params);
		$ans2 = [];
*/
//		if(!empty($results) && isset($results['aggregations'])) {
//
//			foreach ($results['aggregations']['host']['buckets'] as $bucket) {
//				// key is a host
////				if (isset($ans1[$bucket['key']]))
////				{
//				$ans1[] = array('key' => $bucket['key'], 'hits' => $bucket['doc_count']);
////				} else {
////					$ans2[$bucket['key']] = array('key' => $bucket['key'], 'hits' => $bucket['doc_count']);
////				}
////			}
//
//			}
//			/*sort($ans2);
//                $ans = array_merge($ans1, $ans2);
//            // Connect to aggregated data
//            return array_values($ans);*/
//		}
//			return $results['aggregations']['host']['buckets'];
		return ['data'=>$results, 'finished'=> $finished];
		
	}

	function get_subdomains($root_domain){
		$params = [
			'index' => 'telepath-domains',
			'type' => 'domains',
			'id' => $root_domain
		];

		if($this->elasticClient->exists($params)){
			$result = $this->elasticClient->getSource($params);
			if(isset ($result['subdomains']) && !empty($result['subdomains'])){
				return $result['subdomains'];
			}

		}

		return false;
	}

//	function get_root_domain($domain){
//		$params = [
//			'index' => 'telepath-domains',
//			'type' => 'domains',
//			'id' => $domain
//		];
//
//		if($this->elasticClient->exists($params)){
//			return $domain;
//		}
//		else{
//			return $this->index($domain,false,['subdomains']);
//		}
//	}
	
	function old_get_search($search, $mode) {

		$params['index'] = 'telepath-20*';
		$params['type']='http';

		if ($mode == 'page')
			$field = "uri";
		if ($mode == 'param')
			$field = "parameters.name";
		$params['_source_include'] = ["host", "uri", "parameters.name", "parameters.type"];
		$params['body'] = [
			'size'   => 9999,
			'query'  => [ "bool" => [ "filter" => [ "query_string" => [ "fields" => [ "host", $field] , "query" =>'*'. $search . '*' ] ] ] ],
		];
		$params['timeout'] = $this->config->item('timeout');

		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);

		if(empty($results['hits']['hits'])) {
			return array();
		}

		$out = array();
		$search = strtolower($search);

		foreach($results['hits']['hits'] as $res) {
			$result = $res['_source'];

			$hash = crc32(serialize($result));
			if(isset($out[$hash])) { continue; }

			if (strpos(strtolower($result['host']), $search) !== false) {

				$data = array('type' => 'app', 'text' => $result['host']);
				$out[crc32(serialize($data))] = $data;

			} else if($mode == 'page' && strpos(strtolower($result['uri']), $search) !== false) {

				 $data = array('type' => 'page', 'text' => $result['uri'], 'host' => $result['host']);
				 $out[crc32(serialize($data))] = $data;

			 } else if ($mode == 'param' && !empty($result['parameters'])) {

				foreach($result['parameters'] as $param) {

					if(strpos(strtolower($param['name']), $search) !== false) {

						$data = array('type' => 'param', 'uri' => $result['uri'], 'host' => $result['host'], 'text' => $param['name'], 'param_type' => $param['type']);
						$out[crc32(serialize($data))] = $data;
						break;

					}


				}

			}


		}

		return array_values($out);
	
	}

	function get_search($search, $mode)
	{

		$params['index'] = 'telepath-20*';
		$params['type'] = 'http';

		if ($mode == 'page')
			$field = "uri";
		if ($mode == 'param')
			$field = "parameters.name";
		$params['_source_include'] = ["host", "uri", "parameters.name", "parameters.type"];
		$params['body'] = [
			'size' => 9999,
			'query' => ["bool" => ["filter" => ["query_string" => ["fields" => ["host", $field], "query" => '*' . $search . '*']]]],
		];
		$params['body']['highlight']['fields'] = ['host' => new \stdClass(), $field => new \stdClass()];
		$params['body']['highlight']['pre_tags'] = [''];
		$params['body']['highlight']['post_tags'] = [''];
		$params['timeout'] = $this->config->item('timeout');


		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);

		if (empty($results['hits']['hits'])) {
			return array();
		}

		$data = [];

		foreach ($results['hits']['hits'] as $res) {
			$result = $res['highlight'];
			$host = $res['_source']['host'];

			if ($mode == 'page' && isset($result['uri'])) {

				$data[$host][$res['_source']['uri']] = '';

			} elseif ($mode == 'param' && isset($result['parameters.name'])) {
				foreach ($result['parameters.name'] as $param){
					$data[$host][$param] = '';
				}

			} elseif (isset($result['host'])) {

				$data[$host] = '';

			}


		}

		return $data;

	}
	
	function get_page($host, $path, $mode = '') {

		$params	['index'] = 'telepath-20*';
		$params['body'] = [
			'size' => 999,
			'query' => ["bool" => ["filter" => [
				['term' => ["uri" => $path]],
				['term' => ["host" => $host]],
			]
			]
			]
		];
		$params['timeout'] = $this->config->item('timeout');

		$params = append_access_query($params);
		$results = get_elastic_results($this->elasticClient->search($params));

		$out = array();
		if(!empty($results)) {
			foreach($results as $result) {
				// Add sanity check that parameters key exists, Yuli
				if (!empty($result['uri']) && $mode != 'param')
				{
					$data = array('type' => 'page', 'name'=>$result['uri'], 'text' => $result['uri'], 'host' => $result['host']);
					$out[crc32(serialize($data))] = $data;
				}

				if (!empty($result['parameters']) && $mode == 'param')
				{
					$params = $result['parameters'];
					foreach($params as $param) {
						if(isset($param['type']) && ($param['type'] == 'G' || $param['type'] == 'P')) {

							$out[crc32($param['type'] . $param['name'])] = array('name' => $param['name'], 'type' => $param['type']);
						}
					}
				}
			}
		}
		// create fake root, Yuli
		//if (empty($path))
		//{
		//	$data = array('type' => 'dir', 'name' => '/', 'text' => "/", 'host' => $host);
		//	$out[crc32(serialize($data))] = $data;
		//}

		return array_values($out);
	
	}

	function get_deep_items($host, $mode)
	{

		$params['index'] = 'telepath-20*';
		$params['body'] = [
			'size' => 1,
			'aggs' => ['canonical_url' => ["terms" => ["field" => "uri", "size" => 999],],],
			// the cost of query on nested parameters is very expensive
			//						'aggs' => [
//				'canonical_url' => [
//					"terms" => ["field" => "uri", "size" => 999],
//					"aggs" => [
//						"parameters" => [
//							"nested" => ["path" => "parameters"],
//							"aggs" => [
//								"params_type" => [
//									"terms" => ["field" => "parameters.type", "size" => 999],
//									"aggs" => [
//										"params_name" => [
//											"terms" => ["field" => "parameters.name", "size" => 999]
//										]
//									]
//								]
//							]
//						]
//					]
//				]
//			],
			'query' => ["bool" => ["filter" => ['term' => ["host" => $host]]]]
		];
		if ($mode == 'param') {
			$params['body']['aggs']['canonical_url']['aggs']['params_name']['terms'] = [
				"field" => "parameters.name",
				"size" => 999
			];
		}

		$params['timeout'] = $this->config->item('timeout');

		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);

		if (!empty($results) && isset($results['aggregations'])) {

			$ans = array();
			if ($mode == 'param') {
				foreach ($results['aggregations']['canonical_url']['buckets'] as $uri) {
					foreach ($uri['params_name']['buckets'] as $param) {
						$ans[$uri['key']][] = $param['key'];
					}
				}
			} else {
				foreach ($results['aggregations']['canonical_url']['buckets'] as $uri) {
					$ans[$uri['key']] = $uri['key'];
				}
			}

			return $this->detect_paths($ans);

		}

		return array('key' => '/', 'hits' => 0);

	}

	function old_get_ip_suggestion($host)
	{
		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
                $params['body'] = array(
                        'size'  => 0,
                        'aggs'  => [ 'distinct_ips' => [ "terms" => [ "field" => "http.ip_resp", "size" => 1 ], ], ],
                        'query' => [ 'bool' => [ "filter" => [ /* 'term' => [ '_type' => 'http' ],*/ 'term' => [ 'http.host' => $host ], ] ] ]
                );
                $results = $this->elasticClient->search($params);
                $ans = [];

                if(!empty($results) && isset($results['aggregations'])) {

                        foreach($results['aggregations']['distinct_ips']['buckets'] as $bucket) {
                                // key is a host
                                if (isset($bucket['key']))
                                {
                                        $ans[$bucket['key']] = 1;
                                }
                        }

                }
		$ans2 = array();
		foreach (array_keys($ans) as $ip)
		{
			$ans2[] = ['ip' => $ip];
		}
                // Connect to aggregated data
                return array_values( $ans2 );
	}


	// not used
	function get_index($filter = '') {

		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => [ 'host' => [ "terms" => [ "field" => "host", "size" => 999 ], ], ],
		);
		$params['timeout'] = $this->config->item('timeout');
		
		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);

		if(!empty($results) && isset($results['aggregations'])) {
			
			$ans = array();
			foreach($results['aggregations']['host']['buckets'] as $bucket) {
				$ans[] = array('key' => $bucket['key'], 'hits' => $bucket['doc_count']);
			}
			return $this->detect_paths($ans);
			return $this->detect_subdomains($ans);
			
		} 
		return array();
		
	}
	
	function get_subdomain_autocomplete($filter = '', $offset = 0){
		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
		$params['_source_include'] = ['host'];
		$params['body'] = array(
			'size' => 999,
			'from' => $offset,
			'query'  => [ "bool" => [ "filter" => [ "query_string" => [ "default_field" => "host", "query" =>'*'. $filter . '*' ] ] ] ],
		);
		$params['timeout'] = $this->config->item('timeout');
		
		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);
//		$ans = array();
//
//		if(!empty($results) && isset($results['aggregations'])) {
//
//			foreach($results['aggregations']['host']['buckets'] as $bucket) {
//				$ans[] = array('text' => $bucket['key'], 'hits' => $bucket['doc_count']);
//			}
//
//		}

		$ans = $results['hits']['hits'];
		sort($ans);
		return $ans;

	}
	
	
	function detect_paths($uris) {
		return $this->explodeTree($uris, '/', false);
		
		
		
	}
	
	function explodeTree($array, $delimiter = '_', $baseval = false) {
		if(!is_array($array)) return false;
		$splitRE   = '/' . preg_quote($delimiter, '/') . '/';
		$returnArr = array();
		foreach ($array as $key => $val) {
			// Get parent parts and the current leaf
			$parts  = preg_split($splitRE, $key, -1, PREG_SPLIT_NO_EMPTY);
			$leafPart = array_pop($parts);

			// Build parent structure
			// Might be slow for really deep and large structures
			$parentArr = &$returnArr;
			foreach ($parts as $part) {
				if (!isset($parentArr[$part])) {
					$parentArr[$part] = array();
				} elseif (!is_array($parentArr[$part])) {
					if ($baseval) {
						$parentArr[$part] = array('__base_val' => $parentArr[$part]);
					} else {
						$parentArr[$part] = array();
					}
				}
				$parentArr = &$parentArr[$part];
			}

			// Add the final part to the structure
			if (empty($parentArr[$leafPart])) {
				$parentArr[$leafPart] = $val;
			} elseif ($baseval && is_array($parentArr[$leafPart])) {
				$parentArr[$leafPart]['__base_val'] = $val;
			}
		}
		return $returnArr;
	}


	//not used
	function detect_subdomains($hosts) {
		
		$ans = array();
		
		foreach($hosts as $host) {
			
			$segments = array_reverse(explode('.', $host['key']));
			$level    = 0;
			
			if(count($segments) == 1) {
				// TODO:: Define mapping of host to be not broken down into terms
				continue;
			}
			
			foreach($segments as $segment) {
				
				if($level == 0) {
					$tmp = &$ans;
				} else {
					$tmp = &$tmp[$segments[$level - 1]]['children'];
				}
				
				if(!isset($tmp[$segments[$level]])) {
					$tmp[$segments[$level]] = array('children' => array(), 'hits' => $host['hits']);
					ksort($tmp);
				} else {
					$tmp[$segments[$level]]['hits'] += $host['hits'];
				}
				
				$level++;
				
			}
			
		}
		
		return $ans;
		
	}


	/*public function set_all_operation_mode($mode, $limit = false)
	{

		$params = [
			"index" => "telepath-domains",
			'type' => 'domains',
			'body' => [
				'query' => ['bool' => ['must_not' => ['term' => ['operation_mode' => $mode]]]],
			]
		];

		$update = [
			'operation_mode' => $mode,
		];

		if ($limit){
			$params['body']['query']['bool'] = ['must' => ['term' => ['operation_mode' => $limit]]];
		}

		 update_by_query($this->elasticClient, $params, $update);

	}*/


	function set_operation_mode($app_ids, $mode)
	{
		$params = [];
		foreach ($app_ids as $app_id) {
			$params['body'][] = [
				'update' => [
					'_index' => 'telepath-domains',
					'_type' => 'domains',
					'_id' => $app_id['host']
				]
			];

			//check if define operation mode to Hybrid
			if ($mode == 3) {

				//if now operation mode is Training, set to Production else set to Hybrid
				if ($app_id['operation_mode'] == 1) {
					$new_mode = "2";
				} else {
					$new_mode = "3";
				}
			} else {
				$new_mode = $mode;
			}

			$params['body'][] =[
				'doc' => ['operation_mode' => $new_mode]
			];
		}
		return $this->elasticClient->bulk($params);
	}

	function get_apps_eta()
	{

		$params = [
			'index' => 'telepath-domains',
			'type' => 'domains',
			'_source_include' => ["host", "eta"],
			'sort' => ['learning_so_far'],
			'body' => [
				'size' => 9999
			],
		];

		$params['body']['query']['bool']['filter'][] = ['match' => ['operation_mode' => '1']];
		$params['body']['query']['bool']['must_not'][] = ['exists' => ['field' => 'low_requests']];

		$params['timeout'] = $this->config->item('timeout');

		$res = $this->elasticClient->search($params);

		return get_app_source($res);

	}

	function first_request_time($host)
	{
		$params['index'] = 'telepath-20*';
		$params['body'] = array(
			'size' => 0,
			'aggs' => [
				'min_time' => [
					'min' => [
						'field' => 'ts'
					]
				]
			]
		);

		$params['body']['query']['bool']['filter']['term']['host'] = $host;

		$params['timeout'] = $this->config->item('timeout');

		$result = $this->elasticClient->search($params);

		if (isset($result["aggregations"]) &&
			isset($result["aggregations"]["min_time"]) &&
			!empty($result["aggregations"]["min_time"]["value"])
		) {
			return $result['aggregations']['min_time']['value'];
		}

		return false;
	}

	function mark_low_request($hosts)
	{

		$params = ['body' => []];
		$counter = 0;

		foreach ($hosts as $host) {
			$params['body'][] = [
				'update' => [
					'_index' => 'telepath-domains',
					'_type' => 'domains',
					'_id' => $host
				]
			];

			$params['body'][] = [
				'doc' => ['low_requests' => true]
			];

			$counter++;

			// Every 1000 documents stop and send the bulk request
			if ($counter % 1000 == 0) {
				$this->elasticClient->bulk($params);

				// erase the old bulk request
				$params = ['body' => []];

			}
		}

		// Send the last batch if it exists
		if (!empty($params['body'])) {
			$this->elasticClient->bulk($params);
		}
	}

}
?>
