<?php
	
class M_Requests extends CI_Model {
	
	function __construct() {
		parent::__construct();
		require 'vendor/autoload.php';
		$this->elasticClient = new Elasticsearch\Client();
	}
	
	function get_by_id($id) {
		
		$params['body'] = [
			'size'  => 1,
			'query' => [
				"ids" => [
					"type" => "http",
					"values" => [ $id ]
				]
			]
		];
		
		$results = $this->elasticClient->search($params);
		$results = get_elastic_results($results);
		if(!empty($results)) {
			return $results[0];
		}
		return array();
	
	}
	
	function get_latest($desc = true) {
		
		$params['body'] = array(
			'size'  => 1,
			'query' => array(
				'bool' => array(
					'must' => array(
						array('query_string' => array('default_field' => '_type', 'query' => 'http')),
					)
				)
			),
			"sort" => [	[ "ts" => [ "order" => $desc ? "desc" : "asc" ] ] ]
		);
		
		$results = $this->elasticClient->search($params);
		return $results;
	
	}

	function get_similar($id) {
		
		$req = $this->get_by_id($id);
		if(empty($req)) { return array(); }
		
		/*
		$params['body'] = [
		//	"explain" => true,
			"size"    => 100,
			"query"   => 
		];
		*/
		
		$params['body'] = [
			'query' => [
				'bool' => [
					'must' => [
						[ "more_like_this" => [ "ids" => [ $id ], "min_term_freq" => 0, "max_query_terms" => 100, "percent_terms_to_match" => 0.5 ] ]
					],
					'must_not' => [
						[ "term" => [ "ip_orig" => $req['ip_orig'] ] ]
					]
				]
			]
		];
		
		$results = $this->elasticClient->search($params);
		return $results;
		
	}	
	
	function get_by_query($body) {
		
		
		
	}
	
}
?>
