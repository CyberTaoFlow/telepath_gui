<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Cases extends Tele_Controller
{

    // Load Cases Model
    function __construct()
    {

        parent::__construct();
        $this->load->model('M_Cases');
        $this->load->model('M_Config');

    }

    // Get ALL
    public function get_cases()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';
        $search = $this->input->post('search');

        if (!$sort || !in_array($sort, array('created', 'favorite', 'name'))) {
            $sort = 'created';
        }

        $range = $this->_get_range();
        $apps = $this->_get_apps();

        telepath_auth(__CLASS__, __FUNCTION__);
        $res0 = $this->M_Cases->get(100, $range, $apps ,$search);
        $res = array();

        if(!$search ) {
            $search = 'all';
        }
        $all = $this->M_Cases->get_case_data($search);

        if (!isset($all[0])){
            $all=array($all);
        }
        foreach ($all as $tmp) {

            $found = false;
            foreach ($res0 as $case) {
                if ($case['name'] == $tmp['case_name']) {
                    $found = true;
                    $res[] = $case;
                    break;
                }
            }

            if ($found == false) {
                $res[] = array('name' => $tmp['case_name'], 'count' => 0, 'data' => $tmp['details'], 'case_data' => $tmp);
            }
        }

        return_success($res);

    }

    public function get_case_stat()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

//        $now = $this->db->query('SELECT UNIX_TIMESTAMP() as ts')->row_array();
//        $now = $now['ts'];

        $cid = $this->input->post('cid');
        // 7 day range
//        $range = array(
//            'start' => $now - (3600 * 24 * 7),
//            'end' => $now
//        );

        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $chart = $this->M_Cases->get_case_sessions_chart($range, $apps, $cid);
        return_success($chart);

    }

    // Get Specific
    public function get_case()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $this->load->model('M_Alerts');

        // Collect Input
        $cid = $this->input->post('cid');
        $sort = $this->input->post('sort');
        $dir = $this->input->post('dir') == 'true' ? 'ASC' : 'DESC';
       // $case_data= $this->input->post('case_data');

        if (!$sort || !in_array($sort, array('date', 'type', 'counter'))) {
            $sort = 'date';
        }

        $range = $this->_get_range();
        $apps = $this->_get_apps();

        // Done

        // CASE DATA
        // $case = $this->M_Cases->get_case(array('id' => $cid));

        // Contains requests data to display
        $ans = array();

        $requests = $this->M_Cases->get_case_sessions(100, $range, $apps, $cid);
        $similars = $this->M_Cases->get_similar_sessions($requests['requests'], $cid);
       // $requests = $this->M_Cases->new_get_case_sessions(100, $range, $apps, $case_data);

        unset($requests['requests']);

        $ans = array_merge($ans, $requests);
        $ans['chart'] = $this->M_Cases->get_case_sessions_chart($range, $apps, $cid);
        $ans['case'] = array('case_data' => $this->M_Cases->get_case_data($cid));
        $ans['similars']=$similars;

        return_json($ans);

    }

    // Set (Update) Case favorite flag
    public function set_case_fav()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $cid = $this->input->post('cid');
        $fav = $this->input->post('favorite') == 'true';
        $this->M_Cases->update($cid,false,false,$fav);
       // $res = $this->M_Cases->get(array('id' => $cid));
        $res = $this->M_Cases->get_case_data($cid);
        return_success($res);

    }

    // Set (Update) Case
    public function set_case()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $range = $this->_get_range();
        $apps = $this->_get_apps();

        $name = $this->input->post('name');
        $case = $this->input->post('case_data');

        $this->M_Cases->update($name, json_decode($case, true));

        //not used
//        $this->M_Config->update('case_list_was_changed', 1);

        // Return
        return_success();

    }

    // Add (Create) Case
    public function add_case()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        // Collect info
        $name = $this->input->post('name');
        $case = $this->input->post('case_data');

        // Validate
        $tmp = $this->M_Cases->get_case_data($name);
        if (isset($tmp['empty']) && !$tmp['empty'] ) {
            return_success(array('existing' => true));
        }

        // Create
        $cid = $this->M_Cases->create($name, json_decode($case, true));
        //not used
//        $this->M_Config->update('case_list_was_changed', 1);

        // Return
        return_success();

    }

    // Delete Case
    public function del_cases()
    {

        telepath_auth(__CLASS__, __FUNCTION__);
        $cids = $this->input->post('cids');
        $this->M_Cases->delete($cids);
        //not used
//        $this->M_Config->update('case_list_was_changed', 1);

        // Return updated cases list
        $this->get_cases();

    }

    public function flag_requests_by_cases(){

        if ($this->input->post('case')) {
            $cases = $this->input->post('case');
        } else {
            $cases = 'all';
        }

        if ($this->input->post('range')) {
            $range = $this->input->post('range')=='true';
        } else {
            $range = true;
        }

        if ($this->input->post('method')) {
            $method = $this->input->post('method');
        } else {
            $method = 'add';
        }


        $this->M_Cases->flag_requests_by_cases($cases,$range, $method);
    }

}
