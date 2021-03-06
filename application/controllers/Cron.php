<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

ini_set('memory_limit', '512M');

class Cron extends Tele_Controller
{

    public function reports()
    {

        // DB
        $this->load->database();

        // Prep Config
        $this->load->model('M_Config');
        $write_to_syslog_id = $this->M_Config->get_key('write_to_syslog_id');
        $syslog_ip_id = $this->M_Config->get_key('syslog_ip_id');

        // Check Config
        if ($write_to_syslog_id == '1' && $syslog_ip_id != '') {

            // Setup syslog library
            $this->load->library('Syslog');
            $syslog = new Syslog();

            $syslog->SetServer($syslog_ip_id);

            if($syslog_port_id = $this->M_Config->get_key('syslog_port_id')){
                $syslog->SetPort($syslog_port_id);
            }

            $syslog->SetProtocol(strtolower($this->M_Config->get_key('syslog_protocol_id')));



            $syslog->SetFacility(3);
            $syslog->SetSeverity(7);
            $syslog->SetHostname('telepath');

        } else {
            // Syslog is deactivated, nothing to do here
            return;
        }

        // Gather last minute alerts
        //$client = new Elasticsearch\Client();

        // Get rules with checked 'syslog' input (in rules board)
            $params['index'] = 'telepath-rules';
            $params['type'] = 'rules';
            $params['body']['query']['bool']['filter'][] = ['term' => ['action_syslog' => 'true']];
            $params['_source_include'] = ['name'];
            $params['size'] = 999;
            $params['timeout'] = $this->config->item('timeout');
            $results = $this->elasticClient->search($params);

            if (isset($results['hits']) && !empty($results['hits']['hits'])) {
                foreach ($results['hits']['hits'] as $syslog_alert) {
                    $syslog_alerts[] = $syslog_alert['_source']['name'];
                }
            } // If there are no rules with checked 'syslog' input we don't need to run the job
            else {
                return;
            }

        @set_time_limit(-1);

        $current_update = time() - 30;
        $this->load->model('M_Config');
        $last_update = $this->M_Config->get_key('last_syslog_alert_update_id');
        if (empty($last_update)) {
            $last_update = $current_update - 60;
        }

        // search only in relevant index
        $index1 = 'telepath-' . date("Ymd", $current_update);
        $index2 = 'telepath-' . date("Ymd", $last_update);
        $params['index'] = [$index1];
        if ($index2 != $index1) {
            array_push($params['index'], $index2);
        }

        $params = [];


        $params['index'] = 'telepath-20*';
        $params['type'] = 'http';
        $params['body'] = [
            "size" => 1000,
            "sort" => ['ts' => 'desc']
        ];

            $params['body']['query']['bool']['filter'][] = ['terms' => ['alerts.name' => $syslog_alerts]];
        $params['body']['query']['bool']['filter'][] = ['range' => ['ts' => ['gte' => $last_update, 'lt' => $current_update]]];
        $params['timeout'] = $this->config->item('timeout');

        $alerts = $this->elasticClient->search($params);

//        // Get time zone of the server
//        $tz = exec('date +%Z');
//
//        // Current time according to time zone
//        $date = new DateTime("now", new DateTimeZone($tz));
//        $end = $date->format(DATE_RFC2822);
//
//        // Start time according to time zone
//        $date->setTimestamp($ts_start);
//        $start = $date->format(DATE_RFC2822);

        $start = date(DATE_RFC2822, $last_update);
        $end = date(DATE_RFC2822, $current_update);


//        echo 'Since ' . $start . ' Till ' . $end . ' there are ' . $alerts['hits']['total'] . ' alerts. ' . "\n";

        if (!empty($alerts['hits']['hits'])) {
            $alerts = $alerts['hits']['hits'];

            $delimiter = $this->M_Config->get_key('syslog_delimiter_id');

            switch ($delimiter) {
                case "Tab":
                    $delimiter = "\t";
                    break;
                case "Vertical Bar":
                    $delimiter = "|";
                    break;
                default:
                    $delimiter = "\t";
            }

            foreach ($alerts as $alert) {

                $id = $alert['_id'];
                $alert = $alert['_source'];

                // new line for syslog
                $row_syslog = $alert['ts'] . $delimiter . $alert['ip_orig'] . $delimiter . $alert['ip_resp'] . $delimiter;
                // Just in case..
                if (!empty($alert['alerts'])) {
                    foreach ($alert['alerts'] as $a) {
                        $row_syslog .= $a['name'] . ',';
                    }

                    $row_syslog = substr($row_syslog, 0, -1) . $delimiter;
                }

                $row_syslog .= $alert['host'] . $delimiter . $alert['uri'] . $delimiter . $alert['country_code'] .
                    $delimiter . $alert['city'] . $delimiter . $alert['score_average'] . $delimiter . $alert['ip_score']
                    . $delimiter . $alert['score_landing'] . $delimiter . $alert['score_query'] . $delimiter . $alert['score_flow'] .
                    $delimiter . $alert['score_geo'] . $delimiter;

                // Cases
//            if (!empty($alert['cases_name'])) {
//                foreach ($alert['cases_name'] as $case) {
//                    $row_syslog .= $case . ',';
//                }
//                $row_syslog = substr($row_syslog, 0, -1);
//            } else {
//                $row_syslog .= 'No Case';
//            }
//            $row_syslog .= $delimiter;

                // Parameters
                $parameters = '';

                if (!empty($alert['parameters'])) {

                    // Concat interacting parameters
                    foreach ($alert['parameters'] as $p) {
                        if (intval($p['score_data']) > 85) {
                            $parameters .= $p['name'] . '=' . $p['value'] . ',';
                        }
                    }
                    // Trailing comma
                    $parameters = substr($parameters, 0, -1);
                }

                if ($parameters == '') {
                    $parameters = 'No relevant parameters';
                }

                $row_syslog .= $parameters . $delimiter;

                // add link to the specific alert
                $row_syslog .= $this->config->base_url() . '#alerts/' . $alert['sid'] . '/' . $alert['ip_orig'] . '/' .
                    urlencode($alert['alerts'][0]['name']) . '/' . $id;

//                echo $row_syslog;

                $syslog->SetContent($row_syslog);
                $syslog->Send();

            }
        }


        $this->M_Config->update('last_syslog_alert_update_id', $current_update);



    }

    public function index()
    {

        if (!is_cli() && !ENVIRONMENT == 'development') {
            echo 'This script can be run via CLI only';
            die;
        }

        // DB
        $this->load->database();

        // Prep Config
        $this->load->model('M_Config');
        $config = $this->M_Config->get();

        // Task 1 -- Update known bad IP's and Tor exit nodes
        $this->_update($config);

    }

    public function __construct()
    {

        parent::__construct();
        require 'vendor/autoload.php';

    }

    public function debug()
    {

        $conf = $this->_compile_mail_config();

        print_r($conf);

    }

    private function _compile_mail_config()
    {

        $mail_config = array();

        // 1. load all groups
        $this->load->model('Ion_auth_model');
        $acl = $this->Ion_auth_model;

        $all_groups = $acl->groups()->result();
        $all_users = $acl->users()->result();

        foreach ($all_users as $user) {

            // Check if user has email defined

            if (!isset($user->email) || $user->email == '') {
                continue; // Nothing to do then, break the loop.
            } else {
                $mail_config[$user->email] = array();
            }

            // Check if user explicity configured mail settings

            if (isset($user->extradata) && $user->extradata != '') {

                $tmp = json_decode($user->extradata);

                if (isset($tmp->apps)) {
                    $mail_config[$user->email]['explicit_apps'] = $tmp->apps;
                }

                if (isset($tmp->extra)) {

                    if ($tmp->extra->mail_reports == '0') {
                        $mail_config[$user->email]['explicit_reports'] = false;
                    }
                    if ($tmp->extra->mail_reports == '1') {
                        $mail_config[$user->email]['explicit_reports'] = true;
                    }
                    if ($tmp->extra->mail_alerts == '0') {
                        $mail_config[$user->email]['explicit_alerts'] = false;
                    }
                    if ($tmp->extra->mail_alerts == '1') {
                        $mail_config[$user->email]['explicit_alerts'] = true;
                    }

                }

            }

            $mail_config[$user->email]['implicit_apps'] = array();

            // Check if one of user groups implicitly configured mail settings
            $user_groups = $acl->get_users_groups($user->user_id)->result();

            foreach ($user_groups as $group) {

                if (isset($group->extradata) && $group->extradata != '') {

                    $tmp = json_decode($group->extradata);

                    if (isset($tmp->apps)) {
                        $mail_config[$user->email]['implicit_apps'] = array_unique(array_merge($mail_config[$user->email]['implicit_apps'], $tmp->apps));
                    }

                    if (isset($tmp->extra)) {

                        if ($tmp->extra->mail_reports == '1') {
                            $mail_config[$user->email]['implicit_reports'] = true;
                        }
                        if ($tmp->extra->mail_alerts == '1') {
                            $mail_config[$user->email]['implicit_alerts'] = true;
                        }

                    }


                } else {
                    // No specific applications / mailer settings
                    //continue;
                }

            }

        }

        return $mail_config;

    }

    public function _update($config)
    {

        $base_path = 'http://188.166.57.109/updates/';

        $proxy = $config['proxy_mode_id'] == '1' &&
        $config['proxy_ip_id'] != '' &&
        $config['proxy_port_id'] != '' ?
            $config['proxy_ip_id'] . ':' . $config['proxy_port_id'] : false;

        // Deprecated code
        // $bot_list = $this->_simple_curl($base_path . 'Known-Bot.txt', $proxy);
        // $tor_list = $this->_simple_curl($base_path . 'Tor_ip_list_EXIT.txt', $proxy);
        // $bot_list = explode("\n", $bot_list);
        // $tor_list = explode("\n", $tor_list);

        // New code

        $bot_list = array();
        $tor_list = array();

        $updates_data = gzuncompress($this->_simple_curl($base_path . 'updates.gz', $proxy));
        $mode = '';
        $updates_data = explode("\n", $updates_data);

        foreach ($updates_data as $row) {
            if ($row == "BAD_IPS >>>") {
                $mode = 'bad_ip';
                continue;
            }
            if ($row == "TOR_EXIT >>>") {
                $mode = 'tor_exit';
                continue;
            }
            if ($mode == 'bad_ip') {
                $bot_list[] = $row;
            }
            if ($mode == 'tor_exit') {
                $tor_list[] = $row;
            }
        }

        $bots = 0;
        $tors = 0;

        // Delete existing index to save only relevant data and recreate it with correct settings
        $params = ['index' => 'telepath-bad-ips'];

        $this->elasticClient->indices()->delete($params);
        $this->elasticClient->indices()->refresh();

        $params ['body'] = [
            'settings' => [
                'number_of_shards' => 1,
                'number_of_replicas' => 0,
                'max_result_window' => 500000
            ]
        ];

        $this->elasticClient->indices()->create($params);

        $params['type'] = 'bad';
        $params ['body'] = [];

        foreach ($bot_list as $line) {
            preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $m);
            if (!empty($m)) {
                $bots++;

                $params['body'][] = [
                    'index' => [
                        '_id' => $m[0]
                    ]
                ];

                $params['body'][] = [];

                // Every 1000 documents stop and send the bulk request
                if ($bots % 1000 == 0) {
                    $responses = $this->elasticClient->bulk($params);

                    // erase the old bulk request
                    $params ['body'] = [];

                    // unset the bulk response when you are done to save memory
                    unset($responses);
                }
            }
        }

        // Send the last batch if it exists
        if (!empty($params['body'])) {
            $this->elasticClient->bulk($params);
        }


        $params = ['index' => 'telepath-tor-ips'];
        $this->elasticClient->indices()->delete($params);
        $this->elasticClient->indices()->refresh();


        $params ['body'] = [
            'settings' => [
                'number_of_shards' => 1,
                'number_of_replicas' => 0,
            ]
        ];

        $this->elasticClient->indices()->create($params);

        $params['type'] = 'tor';
        $params ['body'] = [];

        foreach ($tor_list as $line) {
            preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $m);
            if (!empty($m)) {
                $tors++;

                $params['body'][] = [
                    'index' => [
                        '_id' => $m[0]
                    ]
                ];

                $params['body'][] = [];

                // Every 1000 documents stop and send the bulk request
                if ($tors % 1000 == 0) {
                    $responses = $this->elasticClient->bulk($params);

                    // erase the old bulk request
                    $params ['body'] = [];

                    // unset the bulk response when you are done to save memory
                    unset($responses);
                }
            }
        }

        // Send the last batch if it exists
        if (!empty($params['body'])) {
            $this->elasticClient->bulk($params);
        }


        echo 'Telepath Updated :: KB :: ' . $bots . ' :: TOR :: ' . $tors . "\n";

        //      $insert_data = array();

        /*foreach ($bot_list as $line) {
            preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $m);
            if (!empty($m)) {
                $insert_data[] = array('ip_addr' => $m[0], 'name' => 'KB');
                $bots++;
            }
        }
        foreach ($tor_list as $line) {
            preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $m);
            if (!empty($m)) {
                $insert_data[] = array('ip_addr' => $m[0], 'name' => 'Tor');
                $tors++;

            }
        }*/

//        foreach ($bot_list as $line) {
//            preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $m);
//            if (!empty($m)) {
//                $insert_data[] = array('from' => $m[0], 'to' => $m[1]);
//                $bots++;
//            }
//        }
//        foreach ($tor_list as $line) {
//            preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $m);
//            if (!empty($m)) {
//                $insert_data[] = array('from' => $m[0], 'to' => $m[1]);
//                $tors++;
//            }
//        }
//
//        echo 'Telepath Update :: KB :: ' . $bots . ' :: TOR :: ' . $tors . "\n";
//
//        echo 'Updating DB Start';
//
//        $params = [
//            'index' => 'telepath-config',
//            'type' => 'ips',
//            'id' => 'bad_ips',
//            'body' => [
//                'doc' => [
//                    'ips' => $insert_data
//                ],
//                'doc_as_upsert' => true
//            ]
//        ];
//
//
//        $this->elasticClient->update($params);
//       /* $this->db->query('TRUNCATE TABLE bad_ips');
//        $this->db->insert_batch('bad_ips', $insert_data);
//        $this->db->query("UPDATE config SET value='1' WHERE action_code=71");*/
//        echo 'Updating DB End';

    }

    public function _simple_curl($url, $proxy = false)
    {

        // is cURL installed yet?
        if (!function_exists('curl_init')) {
            die('Sorry cURL is not installed!');
        }

        $ch = curl_init();

        if ($proxy) {
            curl_setopt($ch, CURLOPT_HTTPPROXYTUNNEL, 0);
            curl_setopt($ch, CURLOPT_PROXY, $proxy);
        }

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $output = curl_exec($ch);

        if (curl_errno($ch)) {
            echo 'error:' . curl_error($ch) . "\n";
            return '';
        }

        curl_close($ch);
        return $output;

    }

}
