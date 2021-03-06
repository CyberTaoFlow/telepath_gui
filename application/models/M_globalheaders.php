<?php

class M_Globalheaders extends CI_Model {
	
	private $tableName = 'global_headers';
		
	function __construct()
	{
		parent::__construct();
	}


	public function get_global_headers()
	{

		$params = [
			'index' => 'telepath-config',
			'type' => 'headers',
			'id' => 'globalheaders_id',
		];

		$result = $this->elasticClient->get($params);

		return $result['_source']['headers'];

	}
	
}

?>
