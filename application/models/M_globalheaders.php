<?php

class M_Globalheaders extends CI_Model {
	
	private $tableName = 'global_headers';
		
	function __construct()
	{
		parent::__construct();
	}

	public function sql_get_global_headers($app_id = 0) {

		$this->db->select('att_id, att_name');
		$this->db->from($this->tableName);
		$this->db->where('app_id', $app_id);
		
		if(!$this->acl->all_apps()) {
			$this->db->where_in('app_id', $this->acl->allowed_apps);
		}
		
		$query  = $this->db->get();
		$result = $query->result();

		return $result;
		
	}

	public function get_global_headers($app_id = 0) {

//		/telepath-config/headers/globalheaders_id
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
