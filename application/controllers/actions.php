<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

/**
 * @property  M_Config M_Config
 */
class Actions extends Tele_Controller
{

    public function __construct()
    {

        parent::__construct();
        require 'vendor/autoload.php';
        $this->load->model('M_Actions');
        //$this->client = new Elasticsearch\Client();
        $params = array('hosts' => array('127.0.0.1:9200'));
#$params = array();
#$params['logging'] = true;
#$params['logPath'] = '/tmp/elasticsearch.log';
        $this->client = new Elasticsearch\Client($params);

    }

    public function set_delete_action()
    {

        // telepath_auth(__CLASS__, 'set_action');

        $host = $this->input->post('application');
        $action = $this->input->post('action');
        $uid = $this->input->post('uid');

        $deleteParams = array();
        $deleteParams['index'] = 'telepath-actions';
        $deleteParams['type'] = 'actions';
        $deleteParams['id'] = $uid;
        $retDelete = $this->client->delete($deleteParams);

        $this->client->indices()->refresh(array('index' => 'telepath-actions'));

        $this->load->model('M_Config');

        //not used
//        $this->M_Config->update('business_flow_was_changed', 1);

        return_success($uid);

    }

    public function get_action_autocomplete()
    {

        telepath_auth(__CLASS__, 'get_action');

        $text = $this->input->post('text', true);
        $text = str_replace(":", "", $text);
        $text = trim($text);

        $params['index'] = 'telepath-actions';
        $params['type'] = 'actions';
        $params['body']['size'] = 999;
        $params['body'] = [
            'partial_fields' => [
                "_src" => [
                    "include" => ["application", "action_name"]
                ],
            ],
            'size' => 9999,
            'query' => ["bool" => ["must" => ["query_string" => ["fields" => ["application", "action_name"], "query" => '*' . $text . '*']]]],
        ];

        $results = $this->client->search($params);

        $ans = [];
        if (!empty($results['hits']['hits'])) {
            foreach ($results['hits']['hits'] as $hit) {
                $fields = $hit['fields']['_src'][0];
                $ans[] = array('text' => $fields['application'] . ' :: ' . $fields['action_name'], 'raw' => $fields);
            }
        }
        return_success($ans);

    }

    public function set_clear_actions()
    {

        telepath_auth(__CLASS__, 'set_action');

        $params['index'] = 'telepath-actions';
        $params['type'] = 'actions';
        $params['body']['query']['match']['domain'] = '192.168.1.111';
        $res = $this->client->deleteByQuery($params);

    }

    public function get_app_actions()
    {

        telepath_auth(__CLASS__, 'get_action');

        $ret = array();
        $host = $this->input->post('host');

        $params['index'] = 'telepath-actions';
        $params['type'] = 'actions';
        $params['body']['size'] = 999;
        $params['body']['query']['match']['application'] = $host;

        $results = get_elastic_results($this->client->search($params));
        return_success($results);

    }


    public function set_flow()
    {

        telepath_auth(__CLASS__, 'set_action');

        $app = $this->input->post('app');
        $name = $this->input->post('flow_name');
        $data = $this->input->post('json');
        $data = json_decode($data);

        $new_json = array('action_name' => $name, 'application' => $app, 'business' => $data);
        // Make sure we have an index
        $indexParams['index'] = 'telepath-actions';
        // Create index if it does not exists only (Yuli)
        $settings = $this->client->indices()->getSettings($indexParams);
        if (!$settings) {
            $this->client->indices()->create($indexParams);
        }
        // Delete old
        $params['index'] = 'telepath-actions';
        $params['type'] = 'actions';
        $params['body']['query']['bool']['must'][] = ['term' => ['action_name' => $name]];
        $params['body']['query']['bool']['must'][] = ['term' => ['application' => $app]];
        $res = $this->client->deleteByQuery($params);

        // Insert new
        $params = ['body' => $new_json, 'index' => 'telepath-actions', 'type' => 'actions'];
        $this->client->index($params);
        $this->client->indices()->refresh(array('index' => 'telepath-actions'));

        $this->load->model('M_Config');

        //not used
//        $this->M_Config->update('business_flow_was_changed', 1);

        return_success();

    }

    public function _hybridrecord_to_sid($value, $host)
    {

        $scope = 300; // in last 5 minutes

        $params['body'] = [
            'size' => 100,
            'query' => ['bool' =>
                ['must' => [
                    ['term' => ['_type' => 'http']],
                    ['term' => ['parameters.name' => 'hybridrecord']],
                    ['range' => ['ts' => ['gte' => intval(time() - $scope)]]]
                ],
                ]]
        ];

        $results = array();
        $result = get_elastic_results($this->client->search($params));
        if (!empty($result)) {

            foreach ($result as $row) {
                if (!empty($row['parameters'])) {
                    foreach ($row['parameters'] as $param) {
                        // We got our session, return its SID and offset timestamp
                        if ($param['name'] == 'hybridrecord' && $param['value'] == $value) {
                            return_success(array('sid' => $row['sid'], 'ts' => $row['ts']));
                        }
                    }
                }
            }

        } else {
            // Return empty array to UI, nothing found (yet)
            return_success();
        }

        // Something went wrong
        return_success();

    }

    public function get_requests()
    {

        telepath_auth(__CLASS__, 'get_action');

        // Mode, either IP, SID, PARAM or USER
        $mode = $this->input->post('mode');
        // The value for the mode
        $value = $this->input->post('value');
        // Host on which to track, can be black for cross host sessions
        $host = $this->input->post('host');
        // Offset timestamp - only return requests with timestamp greater than supplied (only new requests)
        $offset = $this->input->post('offset');
        // If no offset was provided assign 0 to keep query working

        // When this flag is set only return TS of last request
        $lockon = ($this->input->post('lockon') == 'true') ? true : false;

        // empty array (Yuli)
        $params = array();
        // Base query
        $params['body'] = [
            'size' => 100,
            'query' => ['bool' => ['must' => [['term' => ['_type' => 'http']]]]],
            'sort' => [["ts" => ["order" => "desc"]]]
        ];

        if ($offset) {
            $params['body']['query']['bool']['must'][] = ['range' => ['ts' => ['gte' => $offset]]];
        }
        if ($host) {
            $params['body']['query']['bool']['must'][] = ['term' => ['host' => $host]];
        }

        // sanity check (Yuli)
        if ($mode == 'IP') {
            // we need to check if IP hass correct format
            // we will silently ignore this request returning empty result
            if (filter_var($value, FILTER_VALIDATE_IP) === false) {
                $empty_result = array();
                return_success($empty_result);
            }
        }

        switch ($mode) {

            case 'IP':

                $params['body']['query']['bool']['must'][] = ['term' => ['ip_orig' => $value]];

                break;

            case 'URL':

                $value = $this->_hybridrecord_to_sid($value, $host);

            // No break, continue as SID
            // break;

            case 'SID':

                $params['body']['query']['bool']['must'][] = ['term' => ['sid' => $value]];

                break;
        }

        $results = array();
        $result = get_elastic_results($this->client->search($params));

        // Strip headers
        $clean = array();
        if (!empty($result)) {

            if ($lockon) {

                $max_ts = 0;
                foreach ($result as $request) {
                    if (intval($request['ts']) > $max_ts) {
                        $max_ts = $request['ts'];
                    }
                }
                return_success(array('ts' => $max_ts));

            } else {

                foreach ($result as $request) {

                    // Copy aside, remove, initialize blank
                    $r_params = $request['parameters'];
                    unset($request['parameters']);
                    $request['parameters'] = array();

                    // Append only params of GET/POST
                    if (!empty($r_params)) {
                        foreach ($r_params as $param) {
                            if ($param['type'] == 'P' || $param['type'] == 'G') {
                                $request['parameters'][] = $param;
                            }
                        }
                    }

                    $clean[] = $request;

                }

            }
        }


        return_success($clean);

    }

    public function get_suggest()
    {

        telepath_auth(__CLASS__, 'get_action');

        $host = $this->input->post('host');
        $mode = $this->input->post('mode');

        $sessions = $this->__get_active_sessions($host);
        $res = array();

        switch ($mode) {
            case 'IP':

                // De-Dupe with unique keys
                foreach ($sessions as $session) {
                    $res[$session['ip_orig']] = true;
                }
                // Get keys
                $res = array_keys($res);

                break;

            case 'SID':

                // Javascript doesnt like arrays with numeric keys, it thinks its a really large array
                foreach ($sessions as $session) {
                    $res[] = $session['sid'] . '';
                }

                break;

            case 'user':
                // TODO::
                break;
        }

        return_success($res);

    }

    public function __get_active_sessions($host)
    {

        $scope = 300; // in last 5 minutes

        $params['body'] = [
            'size' => 0,
            "aggs" => [
                "sid" => [
                    "terms" => ["field" => "sid", "size" => 100, "order" => ['date' => 'desc']],
                    "aggs" => [
                        "date" => ["max" => ["field" => "ts"]],
                        "ip_orig" => [
                            "min" => ["field" => "ip_orig"]
                        ],
                    ],
                ],
            ],
            'query' => ['bool' =>
                ['must' => [['term' => ['_type' => 'http']],
                    ['term' => ['host' => $host]],
                    ['range' => ['ts' => ['gte' => intval(time() - $scope)]]]
                ],
                ]]
        ];

        $results = array();
        $result = $this->client->search($params);

        if (isset($result["aggregations"]) &&
            isset($result["aggregations"]["sid"]) &&
            isset($result["aggregations"]["sid"]["buckets"]) &&
            !empty($result["aggregations"]["sid"]["buckets"])
        ) {

            $sid_buckets = $result["aggregations"]["sid"]["buckets"];
            foreach ($sid_buckets as $sid) {
                $results[] = array("sid" => $sid['key'], "ts" => $sid['date']['value'], "ip_orig" => long2ip($sid['ip_orig']['value']));
            }
        }

        return $results;

    }

    // Track specific session
    public function track_session_by_sid()
    {

        $sid = $this->input->post('sid'); // at this sid
        $offset = $this->input->post('time'); // starting this stamp

        return_success($result);

    }


}
