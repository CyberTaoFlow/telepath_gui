<?php
	
class M_Applications extends CI_Model {
	
	function __construct() {
		parent::__construct();
		require 'vendor/autoload.php';
$params = array('hosts' => array('127.0.0.1:9200'));
#$params = array();
#$params['logging'] = true;
#$params['logPath'] = '/tmp/elasticsearch.log';
		$this->elasticClient = new Elasticsearch\Client($params);
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
		$params['body'] = [
			'size'   => 1,
			'query' => [ "match" => [
				"name" => $data['name']
			]
			]
		];


		$results = $this->elasticClient->search($params);
		$exists  = intval($results['hits']['total']) > 0;

		// Prep

		$params = array();
		$params['index'] = 'telepath-domains';
		$params['type']  = 'domains';
//		$params['id']    = $results['hits']['hits'][0]['_id'];

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
//			$params['id'] =null;
			$params['body']  = $data;
			$ret =  $this->elasticClient->index($params);

		} else {

			// Update
			$params['id']    = $results['hits']['hits'][0]['_id'];
			$params['body']  = [ 'doc' => $data ];
			$ret =  $this->elasticClient->update($params);

		}

		$this->elasticClient->indices()->refresh(array('index' => 'telepath-domains'));

	}

	/*function delete($host) {
		# Delete host from the application index, Yuli
		$params['index'] = 'telepath-applications';
		$params['type'] = 'application';
                $params['body']['query']['match']['host'] = $host;
		$results = $this->elasticClient->deleteByQuery($params);

		# Delete all records where HTTP host is used the same ias $host, Yuli
		$params = array();
		$params['index'] = '_all';
		$params['body']['query']['bool']['must']['term']['http.host'] = $host;
		$results = $this->elasticClient->deleteByQuery($params);
	}*/

	function delete($host) {
		# Delete host from the application index, Yuli
		$params['index'] = 'telepath-domains';
		$params['type'] = 'domains';
		$params['body']['query']['match']['name'] = $host;
		$results = $this->elasticClient->deleteByQuery($params);

		# Delete all records where HTTP host is used the same ias $host, Yuli
		$params = array();
		$params['index'] = '_all';
		$params['body']['query']['bool']['must']['term']['host'] = $host;
		$results = get_elastic_results($this->elasticClient->search($params));

		foreach ($results as $res){
			$params=[];
			$params['index'] = $res['index'];
			$params['type'] = $res['type'];
			$params['id']=$res['uid'];
			$this->elasticClient->delete($params);
		}
	}

	function get($host) {
		
		// Check
		$params['index'] ='telepath-domains';
		$params['type'] = 'domains';
		$params['body'] = [
			'size'   => 1,
				'query' => [ "match" => [
					 "name" => $host
				]
				]
		];
		
		$results = $this->elasticClient->search($params);
		$exists  = @intval($results['hits']['total']) > 0;
		if(!$exists) {
			return false;
		}
		
		$app = $results['hits']['hits'][0]['_source'];
		
		if(isset($app['app_ssl_certificate'])) { unset($app['app_ssl_certificate']); }
		if(isset($app['app_ssl_private'])) { unset($app['app_ssl_private']); }
		if(!isset($app['cookie_suggestion'])) { $app['cookie_suggestion'] = ''; }
		if(!isset($app['form_authentication_redirect_response_range'])) { $app['form_authentication_redirect_response_range'] = ''; }
		$app['ip_suggestion'] = '';	
		
		return array($app);
		
	}
	
	function index($search = false) {
		
		// Search specific records first

		$params = [
			'index' => 'telepath-domains',
			'type' => 'domains',
			'body' => [
				'size'=>999,
				'query' => [
					'match_all' => [

					]
				]
			]
		];

		$results = get_elastic_results($this->elasticClient->search($params));

		$ans1 = [];
		if(!empty($results)) {
			foreach($results as $result) {
				if(isset($result['uid'])) {
					$ans1[$result['uid']] = [ 'key' => $result['name'], 'hits' => 0 ];
				}
			}
		}

		return array_values($ans1);
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

		if(!empty($results) && isset($results['aggregations'])) {

			foreach($results['aggregations']['host']['buckets'] as $bucket) {
				// key is a host
				if (isset($ans1[$bucket['key']]))
				{
					$ans1[$bucket['key']] = array('key' => $bucket['key'], 'hits' => $bucket['doc_count']);
				} else {
					$ans2[$bucket['key']] = array('key' => $bucket['key'], 'hits' => $bucket['doc_count']);
				}
			}

		}
		sort($ans2);
	        $ans = array_merge($ans1, $ans2);
		// Connect to aggregated data
		return array_values($ans);*/
		
	}
	
	function get_search($search) {

		$params['index']='telepath-domains';
		$params['body'] = [
			'partial_fields' => [ 
				"_src" => [
					"include" => ["name", "uri", "parameters.name", "parameters.type"]
				],
			],
			'size'   => 9999,
			'query'  => [ "bool" => [ "must" => [ "query_string" => [ "fields" => [ "name", "uri", "parameters.name"] , "query" => '*' . $search . '*' ] ] ] ],
		];
		
		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);
		
		if(empty($results['hits']['hits'])) {
			return array();
		}
		
		$out = array();
		$search = strtolower($search);
		
		foreach($results['hits']['hits'] as $res) {
			$result = $res['fields']['_src'][0];
			
			$hash = crc32(serialize($result));
			if(isset($out[$hash])) { continue; }
			
			if(strpos(strtolower($result['uri']), $search) !== false) {
				
				$data = array('type' => 'page', 'text' => $result['uri'], 'host' => $result['host']);
				$out[crc32(serialize($data))] = $data;
				
			} else if (strpos(strtolower($result['host']), $search) !== false) {
				
				$data = array('type' => 'app', 'text' => $result['host']);
				$out[crc32(serialize($data))] = $data;
			
			} else if (!empty($result['parameters'])) {
				
				foreach($result['parameters'] as $param) {
						
					if(strpos(strtolower($param['name']), $search) !== false) {
						
						$data = array('type' => 'param', 'uri' => $result['uri'], 'host' => $result['host'], 'text' => $param['name'], 'param_type' => $param['type']);
						$out[crc32(serialize($data))] = $data;
						
					}
					
					break;
					
				}
				
			}
			
			
		}

		return array_values($out);
	
	}
	
	function get_page($host, $path, $mode = '') {
		
		$params['body'] = [
			'size'   => 999,
			'query' => [ "bool" => [ "must" => [ 'term' => [ "uri" => $path ], 'term' => [ "host" => $host ] ] ] ]
		];
		
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
	
	function get_host($host) {
		
	
		$params['body'] = [
			'size'   => 1,
			'aggs'   => [ 'uri' => [ "terms" => [ "field" => "uri", "size" => 999 ], ], ],
			'query' => [ "bool" => [ "must" => [ 'term' => [ "host" => $host ]	] ] ]
		];
		
		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);

		if(!empty($results) && isset($results['aggregations'])) {
			
			$ans = array();
			foreach($results['aggregations']['uri']['buckets'] as $bucket) {
				$ans[$bucket['key']] = $bucket['key'];
			}
			
			return $this->detect_paths($ans);
			
		}

		return array('key' => '/', 'hits' => 0);
	
	}

	function get_ip_suggestion($host) {
                $params['body'] = array(
                        'size'  => 0,
                        'aggs'  => [ 'distinct_ips' => [ "terms" => [ "field" => "http.ip_resp", "size" => 1 ], ], ],
                        'query' => [ 'bool' => [ "must" => [ /* 'term' => [ '_type' => 'http' ],*/ 'term' => [ 'http.host' => $host ], ] ] ]
                );
                $results = $this->elasticClient->search($params);
                $ans = [];

                if(!empty($results) && isset($results['aggregations'])) {

                        foreach($results['aggregations']['distinct_ips']['buckets'] as $bucket) {
                                // key is a host
                                if (isset($bucket['key_as_string']))
                                {
                                        $ans[$bucket['key_as_string']] = 1;
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
	
	function get_index($filter = '') {
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => [ 'host' => [ "terms" => [ "field" => "host", "size" => 999 ], ], ],
			'query' => [ 'bool' => [ "must" => [ 'term' => [ '_type' => 'http' ]  ] ] ]
		);
		
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
	
	function get_subdomain_autocomplete($filter = '') {
		
		$params['body'] = array(
			'size'  => 0,
			'aggs'  => [ 'host' => [ "terms" => [ "field" => "host", "size" => 999 ], ], ],
			'query'  => [ "bool" => [ "must" => [ "query_string" => [ "default_field" => "host", "query" => $filter . '*' ] ] ] ],
		);
		
		$params = append_access_query($params);
		$results = $this->elasticClient->search($params);
		$ans = array();
	
		if(!empty($results) && isset($results['aggregations'])) {
			
			foreach($results['aggregations']['host']['buckets'] as $bucket) {
				$ans[] = array('text' => $bucket['key'], 'hits' => $bucket['doc_count']);
			}
			
		}
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
	
}
?>
