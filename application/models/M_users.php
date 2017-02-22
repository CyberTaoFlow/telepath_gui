<?php

class M_Users extends CI_Model
{

    function __construct()
    {
        parent::__construct();

    }


    public function store_users()
    {

        logger('Start','/var/log/web_users.log');

        @set_time_limit(-1);

        $time = time();
        $this->load->model('M_Config');
        $last_update = $this->M_Config->get_key('last_web_users_update_id');

        if($last_update){
            // search only in relevant index
            $index1 = 'telepath-'.date("Ymd",$time);
            $index2 = 'telepath-'.date("Ymd",$last_update - 60);
            $params['index'] = [$index1];
            if($index2 != $index1){
                array_push($params['index'],$index2);
            }
        }
        else{
            $params['index'] = 'telepath-20*';
        }
        $params['type'] = 'http';
        $params['body'] = [
            'size' => 0,
            "aggs" => [
                "users" => [
                    "terms" => ["field" => "username", "size" => 1],
                    "aggs" => [
                        "host" => [
                            "terms" => ["field" => "host", "size" => 1],
                            "aggs" => [
                                "last_activity" => [
                                    "max" => ["field" => "ts"]
                                ]
                            ]
                        ]
                    ]
                ],
            ]
        ];

        $params['body']['query']['bool']['must_not'][] = ['term' => ['username' => ""]];

        if ($last_update)
            $params['body']['query']['bool']['filter'][] = ['range' => ['ts' => ['gt' => $last_update - 60]]];

        $params['timeout'] = $this->config->item('timeout');

        $results = $this->elasticClient->search($params);

        if (isset($results['aggregations']) && isset($results['aggregations']['users']) &&
            !empty($results['aggregations']['users']['buckets'])
        ){
            foreach ($results['aggregations']['users']['buckets'] as $res) {

                foreach ($res['host']['buckets'] as $item) {
                    $params = [
                        'index' => 'telepath-users',
                        'type' => 'users',
                        'id' => md5($res['key'] . $item['key']),
                        'body' => [
                            'doc' => [
                                'username' => $res['key'],
                                'host' => $item['key'],
                                'last_activity' => $item['last_activity']['value'],
                            ],
                            'doc_as_upsert' => true
                        ],

                        'refresh' => true
                    ];

                    $this->elasticClient->update($params);

                    logger('Update user: '.$res['key']. ' application: ' . $item['key']);
                }
            }


            }

        $this->M_Config->update('last_web_users_update_id', $time, true);

        logger('Update the time to: '. $time);

        return;
    }




    public function get_users($search = false, $sort, $dir, $offset = 0)
    {
        $params['index'] = 'telepath-users';
        $params['type'] = "users";
        $params['body'] = [
            'sort' => [$sort => $dir],
            'size' => 50,
            'from' => $offset
        ];

        if ($search) {
            $params['body']['query']['bool']['filter'][] = ['query_string' => [  /*'default_field' => 'username',*/
                "query" => $search . '*', "default_operator" => 'AND']];
        }

        $params['timeout'] = $this->config->item('timeout');

        $result = $this->elasticClient->search($params);

        $results = [];

        foreach ($result['hits']['hits'] as $res) {

            $results[] = $res['_source'];
        }



        return $results;
    }



}