<?php

class InvestigateModel extends CI_Model {
	
	function __construct()
	{
		parent::__construct();
	}
	
	function cancel_query($sid) {
		
		$ans = array('success' => true, 'queries' => array());
		$query  = $this->db->query('SHOW FULL PROCESSLIST');
		$result = $query->result();
		$lookup = 'SID:' . $sid . ';';
		
		foreach($result as $row) {
			if(strpos($row->Info, $lookup) > -1) {
				
				if (defined('ENVIRONMENT') && ENVIRONMENT == 'development') {
					$ans['queries'][] = str_replace('/* ' . $lookup . ' */', '', $row->Info);
				}
				
				$this->db->query('KILL ' . $row->Id);
			}
		}
		
		return $ans;
		
	}
	
	function delete_profile($id) {
		
		$this->db->where('id', $id);
		$this->db->from('reports_profiles');
		$this->db->delete();
		
	}
	
	function save_profile($name, $param) {
		
		$this->db->insert('reports_profiles', array('name' => $name, 'description' => $param)); 
		return $this->db->insert_id();
		
	}
	
	function get_profile_list() {
		
		$this->db->select('id, name');
		$this->db->from('reports_profiles');
		$query = $this->db->get();
		return $query->result();
		
	}
	
	function get_profile_details($id) {
		
		$this->db->select('id, name, description');
		$this->db->from('reports_profiles');
		$this->db->where('id', $id);
		$query = $this->db->get();
		$result = $query->result();
		
		$ans = array('total' => 1, 'success' => true, 'items' => array(), 'hidden' => array());
		
		if($result && isset($result[0])) {
			
			$param = $result[0]->description;
			$param = explode(';', $param);
			
			foreach($param as $pair) {
			
				$pair = explode('=', $pair);
				
				$value = '';
				$field = '';
				
				$field = $pair[0];
				
				if(isset($pair[1])) {
					$value = $pair[1];
				}

				if($value != '') {
				
					switch($field) {
						
						case 'Application':
							
							$query = $this->db->select('app_domain')->from('applications')->where('app_id', $value)->get();
							
							if ($query->num_rows() > 0) {
							
								$ans['hidden']['Application ID'] = $value;
								$value = $query->row()->app_domain;
							
							} else {
								if($value == '-1') {
									$value = 'All';
								}
							}

						break;
						case 'Parameter':

							$query = $this->db->select('att_name')->from('attributes')->where('att_id', $value)->get();
							
							if ($query->num_rows() > 0) {
							
								$ans['hidden']['Parameter ID'] = $value;
								$value = $query->row()->att_name;
							
							}

						break;
						case 'Workflow_Group':
						case 'Workflow Group':

							$query = $this->db->select('group_name')->from('business_flow')->where('id', $value)->get();
							
							if ($query->num_rows() > 0) {
							
								$ans['hidden']['Workflow ID'] = $value;
								$value = $query->row()->group_name;
							
							}
							
						break;
					
					}
					
					$ans['items'][] = array('desc' => str_replace('_', ' ',$field) . ': ' . $value);
					
				}
			
			}
			

		}
		
		return $ans;
		
	}
	
	function flows_for_RIDS($RIDS) {
		
		// Nothing to search for
		if(empty($RIDS)) { return array(); }
		
		// Query Flow States
		$this->db->select('business_id, RID, status');
		$this->db->from('flow_states');
		$this->db->where_in('RID', $RIDS);
		
		$query = $this->db->get();
		
		return $query->result();
	
	}
	
	function investigate($search_param, $useTableSplit = true, $only_count = false) {
		
		// Will return this::
		$ans = array();
		
		// Init TableSplit
		
		if($useTableSplit) {
			$this->load->model('TableSplit');
			$tables_requests   = $this->TableSplit->get_table_split('request_scores');
			$tables_attributes = $this->TableSplit->get_table_split('attribute_scores');
			
			$this->db = $this->load->database('default', TRUE);
		} else {
			$tables_requests   = array('request_scores');
			$tables_attributes = array('attribute_scores');
		}
				
		$path_pages = false;
		// Page Search
		if($search_param['path'] != '') {
		
			// Get Pages matching display_path
			$this->load->model('PagesModel');
			$path_pages = $this->PagesModel->page_search_display_path($search_param['path']);
			if(empty($path_pages)) {
				return false;
			}
		
		}
		
		$att_rids = false;
		// Parameter Search
		if($search_param['attribute_filter']) {
			
			$this->load->model('AttributeScores');
			
			// Get RID's (ATT_ID, DATA, UseTableSplit, not single result)
			$att_rids = $this->AttributeScores->get_RID_by_param($search_param['attribute_filter'], $search_param['attribute_filter_val'], true, false);
			if(empty($att_rids)) {
				return false;
			}
		
		}
		
		// Main Loop
		foreach($tables_requests as $table) {
		
			// attributes table
			$attributes_table = str_replace('request_', 'attribute_', $table);
			// make sure we have this table
			if(!isset($tables_attributes[$attributes_table])) {
				$attributes_table = false;
			}
			
			// To have to ability to abort this query by SID
			$this->db->where('/* SID:' . $this->session->userdata('session_id') . '; */1=1', NULL, false);
			
			$this->db->from($table . ' as rs');
			
			if(!$only_count) {
				
				$this->db->select('rs.SID, rs.user, rs.user_ip, rs.query_score, rs.query_score, rs.flow_score, rs.landing_normal, rs.geo_normal, rs.city, rs.country, rs.avg_score, rs.status_code');
				//$this->db->select("FROM_UNIXTIME(rs.`date`, '%H:%i:%s %c/%e/%Y') as time", false);
				$this->db->select("rs.`date` as time", false);
				$this->db->select('rs.seq_index, rs.SID_status, rs.page_id, rs.RID, rs.method, rs.protocol');

				// Hostname search
				if($search_param['sort_field'] == 'hostname') {
				
					$this->db->select('applications.app_domain');
					$this->db->from('applications');
					$this->db->where('applications.app_id = rs.hostname', NULL, false);
					
				} else {
					$this->db->select('(SELECT app_domain FROM applications WHERE rs.hostname=applications.app_id) as hostname', false);
				}
				
				// Title / Path search
				if($search_param['sort_field'] == 'title' || $search_param['sort_field'] == 'path') {
					$this->db->select("pages.page_id, pages.display_path, pages.title");
					$this->db->from('pages');
					$this->db->where('pages.page_id = rs.page_id', NULL, false);
				} else {
					$this->db->select("(SELECT pages.display_path from pages where pages.page_id = rs.page_id) as display_path", false);
					$this->db->select("(SELECT pages.title from pages where pages.page_id = rs.page_id) as title", false);
				}
				
				if($search_param['sort_field'] && $search_param['sort_order']) {
				
					$this->db->order_by($search_param['sort_field'] . ' ' . $search_param['sort_order']);
					
					if($search_param['sort_field'] == 'country') {
						$this->db->order_by('city' . ' ' . $search_param['sort_order']);
					}

				} else {
					$this->db->order_by("rs.date ASC");
				}
				
				if(isset($search_param['page_num']) && isset($search_param['page_rows_number'])) {
					$this->db->limit(intval($search_param['page_rows_number']), intval($search_param['page_num']) * intval($search_param['page_rows_number']));
				} else {
					$this->db->limit(10, 0);
				}
				
			}
			
			// Workflow search
			if($search_param['flow'] != '') {
			
				// Left join
				$this->db->select('flow_states.business_id');
				$this->db->where('flow_states.business_id', $search_param['flow']);
				$this->db->join('flow_states', 'flow_states.RID = rs.RID', 'right');
				
			}
			
			if($search_param['user_agent'] != '' && $attributes_table) {
				$this->db->from($attributes_table);
				$this->db->where($attributes_table . '.RID = rs.RID', NULL, false);
				$this->db->where($attributes_table . '.RID', '5');
				$this->db->where($attributes_table . '.data LIKE', '%' . $search_param['user_agent'] . '%');
			}
							
			if($att_rids) {
				$this->db->where_in('rs.RID', $att_rids);
				$search_param['rid'] = '';
			}
			if($search_param['rid'] != '') {
				$this->db->where('rs.RID', $search_param['rid']);
			}

			
			if($search_param['fromdate'] != "") {
				$this->db->where('rs.date >=', $search_param['fromdate']);
			}
			if($search_param['todate'] != "") {
				$this->db->where('rs.date <=', $search_param['todate']);
			}
			if($search_param['app_id'] != "") {
				$this->db->where('rs.hostname', $search_param['app_id']);
			}
			if($search_param['user'] != "") {
				$this->db->where('rs.user', $search_param['user']);
			}
			if($search_param['SID'] != "") {
				$this->db->where('rs.SID', $search_param['SID']);
			}
			if($search_param['user_ip'] != "") {
				$this->db->where('rs.user_ip', $search_param['user_ip']);
			}
			if($search_param['city'] != "") {
				$this->db->where('rs.city', $search_param['city']);
			}
			if($search_param['country'] != "") {
				$this->db->where('rs.country', $search_param['country']);
			}
			if($search_param['status_code'] != "") {
				$this->db->where('rs.status_code', $search_param['status_code']);
			}
			if($search_param['date'] != "") {
				$this->db->where('rs.date', $search_param['date']);
			}
			if($search_param['hostname'] != "") {
				$this->db->where('rs.hostname', $search_param['hostname']);
			}
			if($search_param['seq_index'] != "") {
				$this->db->where('rs.seq_index', $search_param['seq_index']);
			}
			if($search_param['SID_status'] != "") {
				$this->db->where('rs.SID_status', $search_param['SID_status']);
			}
			
			if($path_pages) {
				switch($search_param['path_mode']) {
					case 'Contains':
					case 'Equals':
						$this->db->where_in('rs.page_id', $path_pages);
					break;
				}
			}
			
			if($search_param['method'] != "") {
				$this->db->where('rs.method', $search_param['method']);
			}
			
			// ADD CRITERIA CONDITION
			
			$default = count($search_param['criteria']) == 1 &&
					   $search_param['criteria'][0]['score_field'] 		== 'avg_score' &&
					   $search_param['criteria'][0]['score_field_type'] == 'At Least' &&
					   $search_param['criteria'][0]['score_field_num']  == '0';
						
			if(count($search_param['criteria']) > 0 && !$default) {
				
				$criteria_query = '(';
				
				foreach($search_param['criteria'] as $criteria) {
				
					$score_field      = $criteria['score_field'];
					$score_field_type = $criteria['score_field_type'];
					$score_field_num  = $criteria['score_field_num'];
					$relation		  = $criteria['relation'];
					
					// Disallow any funky characters in score_field
					if(preg_match('/[^a-z_\-0-9]/i', $score_field)) { die; }
					
					$stat = "";
					switch($score_field_type) {
						case 'more':
							$stat = ">";
						break;
						case 'less':
							$stat = "<";
						case 'At Most':
							$stat = "<=";
						break;
						case 'At Least':
							$stat = ">=";
						break;
						case 'equals':
							$stat = "=";
						break;
					}
					
					$criteria_query .= 'rs.' . $score_field . ' ' . $stat . floatval(floatval($score_field_num) / 100);
					
					if($relation == 'And') {
						$criteria_query .= ' AND ';
					}
					if($relation == 'Or') {
						$criteria_query .= ' OR ';
					}
					
				}
				
				$criteria_query .= ')';
				
				$this->db->where($criteria_query, NULL, false);
				
			}
			
			if(!$this->acl->all_apps()) {
				$this->db->where_in('rs.hostname', $this->acl->allowed_apps);
			}
			
			// Needed to generate paging
			if($only_count) {
				
				$count = $this->db->count_all_results();
				$ans[] = array($count, $table);
				
			} else {
			
				$query = $this->db->get();
				$ans[] = array($query->result(), $table);
				
				//file_put_contents('/tmp/debug', $this->db->last_query(), FILE_APPEND | LOCK_EX);
				
			}

		}
		
		return $ans;
	
	}
	
}

		