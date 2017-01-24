<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

class Rules extends Tele_Controller
{

    function __construct()
    {
        parent::__construct();
        $this->load->model('M_Rules');
    }

    public function debug()
    {
        $this->M_Rules->get_rules();
    }

    public function get_cmds()
    {

        telepath_auth(__CLASS__, 'get_rules');
        $directory = ($this->config->item('scripts'));
        $scanned_directory = array_diff(scandir($directory), array('..', '.'));
        $out = [];
        foreach ($scanned_directory as $v) {
            $out[] = $directory . '/' . $v;
        }
        xss_return_success($out);

    }

    public function old_set_rule()
    {

        telepath_auth(__CLASS__, 'set_rules');
        $data = $this->input->post('ruleData');
        $data = $this->M_Rules->set_rule($data);

        $this->load->model('M_Config');
        $this->M_Config->update('rules_table_was_changed_id', '1');

        xss_return_success($data);

    }


    public function set_rule()
    {

        telepath_auth(__CLASS__, 'set_rules');
        $data = $this->input->post('ruleData');
        $builtin_rule = $this->input->post('builtin_rule') == '1';
        $id = $data['id'];
        $result=[];
        unset($data['id']);


        if ($data['category'] != 'Brute-Force' && $data['category'] != 'Credential-Stuffing' && $data['category'] != 'Web shell'){
            $rules_category = $this->M_Rules->get_rules($data['category']);

            foreach ($rules_category as $rule) {
                if ($rule['name'] == $data['name'] && $rule['uid'] != $id) {
                    return_fail('Rule name already exists');
                }
            }
        }
        foreach($data as $i => $val) {
            if ($val =='true'||$val =='false'){
                $data[$i] = true ? $val=='true': ($val=='false' ? false:$val);
            }

        }

        foreach($data['criteria'] as $i => $val) {
            $data['criteria'][$i] = json_decode($val, true);
        }

        if ($builtin_rule){
            if ($data['category'] == 'Brute-Force' || $data['category'] == 'Credential-Stuffing' || $data['category'] == 'Web shell') {
                $rules = $this->M_Rules->get_rules($data['category'], true);
            }

            else {
                $rules = $this->M_Rules->get_rule_by_name($data['name'],$data['category']);
                $rules[0]['_id'] = $rules[0]['uid'];
//                $rules= [$rules['_id']];
            }

            foreach ($rules as $rule) {

                $r= $this->M_Rules->get_rule_by_id($rule['_id']);

                // fix enable
                foreach ($r['criteria'] as $i => $val)
                {
                    $enable = $val['enable'];
                    foreach ($data['criteria'] as $i2 => $val2)
                    {
                        if ($val["kind"] == $val2["kind"])
                        {
                            $enable = $val2["enable"];
                        }
                    }
                    $r['criteria'][$i]['enable'] = $enable;
                }

                $data['criteria'] = $r['criteria'];
                $data['name'] = $r['name'];
                $data['builtin_rule'] = true;

                $this->M_Rules->set_rule($rule['_id'], $data);
            }
            $result = $this->M_Rules->get_rule_by_name($data['name'],$data['category']);
        }

         else {
             // If the user changed the name, we need to check if some cases include this rule, and update the case
             // detail with the new rule name
             $old_rule = $this->M_Rules->get_rule_by_id($id);
             if ($old_rule['name'] != $data['name']) {
                 $this->load->model('M_Cases');
                 $cases = $this->M_Cases->get_case_data('all');
                 foreach ($cases as $case) {
                     foreach ($case['details'] as $key => $detail) {
                         if ($detail['type'] == 'rules') {
                             $case_rules = explode(',', $detail['value']);
                             foreach ($case_rules as $rule_key => $case_rule) {
                                 if (substr(strstr($case_rule, '::'), 2) == $old_rule['name']) {
                                     $case_rules[$rule_key] = $data['category'] . '::' . $data['name'];
                                     $detail['value'] = implode(',', $case_rules);
                                     $case['details'][$key] = $detail;
                                     $this->M_Cases->update($case['case_name'], $case['details'], $case['updating'],
                                         $case['favorite']);
                                     break;
                                 }
                             }
                             break;
                         }
                     }

                 }

             }

             // update the rule
            $result = $this->M_Rules->set_rule($id, $data);
        }


        $this->load->model('M_Config');
        $this->M_Config->update('rules_table_was_changed_id', '1');

        xss_return_success($result);

    }


    public function add_rule()
    {

        telepath_auth(__CLASS__, 'set_rules');
        $data = $this->input->post('ruleData');


        $rules_category = $this->M_Rules->get_rules($data['category']);

        foreach ($rules_category as $rule){
            if ($rule['name'] == $data['name']){
                return_fail('Rule name already exists');
            }
        }

        $data = $this->M_Rules->add_rule($data);

        $this->load->model('M_Config');
        $this->M_Config->update('rules_table_was_changed_id', '1');

        xss_return_success($data);

    }

    public function add_category()
    {

        telepath_auth(__CLASS__, 'set_rules');
        $cat = $this->input->post('cat', true);
        $data = $this->M_Rules->add_category($cat);
        return_success();

    }

    public function del_category()
    {

        telepath_auth(__CLASS__, 'set_rules');
        $cat = $this->input->post('cat', true);
        $this->M_Rules->del_category($cat);

        $this->load->model('M_Config');
        $this->M_Config->update('rules_table_was_changed_id', '1');

        return_success();

    }


    public function expand_root()
    {

        telepath_auth(__CLASS__, 'get_rules');

        $ans = array('items' => array(), 'total' => 0, 'success' => true);

        $categories = $this->M_Rules->get_categories();

        if ($categories && is_array($categories) && !empty($categories)) {

            foreach ($categories as $category) {

                $ans['items'][] = array(
                    'id' => $category,
                    'name' => $category
                );

            }

        }

        $ans['total'] = count($ans['items']);

        return_json($ans);

    }

    public function expand_category()
    {

        telepath_auth(__CLASS__, 'get_rules');

        $rules = array();
        $category = $this->input->post('id', true);

        $rules = $this->M_Rules->get_rules($category);


        $ans = array('items' => array(), 'total' => 0, 'success' => true);

        if ($category == "Brute-Force") {
            $ans['items'][] = array(
                'id' => $rules[0]['uid'],
                'category' => "Brute-Force",
                'name' => "Login Brute-Force"
            );
        } elseif($category == "Credential-Stuffing") {
            $ans['items'][] = array(
                'id' => $rules[0]['uid'],
                'category' => "Credential-Stuffing",
                'name' => "Credential-Stuffing"
            );
        }elseif($category == "Web shell") {
            $ans['items'][] = array(
                'id' => $rules[0]['uid'],
                'category' => "Web shell",
                'name' => "Webshell action"
            );
        }

        if ($rules && is_array($rules) && !empty($rules)) {
            foreach ($rules as $rule) {
                if(($category == "Brute-Force" || $category == "Credential-Stuffing"|| $category == "Web shell") && isset($rule['builtin_rule']) && $rule['builtin_rule']){
                    continue;
                }
                $ans['items'][] = array(
                    'id' => $rule['uid'],
                    'category' => $rule['category'],
                    'name' => $rule['name']
                );

            }

        }

        $ans['total'] = count($ans['items']);

        return_json($ans);

    }

    public function get_rule()
    {

        telepath_auth(__CLASS__, 'get_rules');

        $rule_id = $this->input->post('id', true);

        $rule = $this->M_Rules->get_rule_by_id($rule_id);

        if ($rule) {
            xss_return_success([$rule]);
        }

    }

    public function del_rule()
    {

        telepath_auth(__CLASS__, 'set_rules');

        $rule_name = $this->input->post('name', true);
        $rule_cat = $this->input->post('category', true);

        $rule = $this->M_Rules->del_rule($rule_name, $rule_cat);

        $this->load->model('M_Config');
        $this->M_Config->update('rules_table_was_changed_id', '1');


        return_success();


    }

    public function searchRules()
    {
        $search = $this->input->post('search');

        $rules= $this->M_Rules->searchRules($search);

        $ans = array('items' => array(), 'total' => 0, 'success' => true);

        if ($rules && is_array($rules) && !empty($rules)) {
            foreach ($rules as $rule) {
                if (!preg_match('/'.$search.'/i',$rule['_source']['name'])){
                    continue;
                }
                $ans['items'][$rule['_source']['category']][] = array(
                    'id' => $rule['_id'],
                    'category' => $rule['_source']['category'],
                    'name' => $rule['_source']['name']
                );

            }

        }

        $ans['total'] = count($ans['items']);

        return_json($ans);
    }

}
