<?php

class M_Actions extends CI_Model {
	
	function __construct() {
		parent::__construct();
		
		// Connect elastic
		//$params = array('hosts' => array('127.0.0.1:9200'));
		$this->elasticClient = new Elasticsearch\Client();
	}

	function get_actions($host) {
		
		$params['body'] = [
			'size'   => 999,
				'query' => [ "bool" => [ "must" => [
					[ 'term' => [ "domain" => $host ] ], 
					[ 'term' => [ '_type' => 'actions' ] ] 
				] ]	]
		];
		
		$results = $this->elasticClient->search($params);
		return $results['hits']['hits'];
	
	}
	
}

?>
