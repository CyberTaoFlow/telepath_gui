<?php

class M_Users extends CI_Model
{

    function __construct()
    {
        parent::__construct();

    }


    public function store_users()
    {

        logger('Start','/var/log/flag_requests_by_users.log');

        $time = time();
        $update_time = $time - 60;
        $this->load->model('M_Config');
        $last_update = $this->M_Config->get_key('last_web_users_update_id');

        /* // get the relevant index
         $index1='telepath-'.date("Ymd",$time);
         $index2='telepath-'.date("Ymd",$last_update);*/

        $params['index'] = 'telepath-20*';
        $params['type'] = 'http';
        $params['body'] = [
            'size' => 0,
            "aggs" => [
                "users" => [
                    "terms" => ["field" => "username"],
                    "aggs" => [
                        "host" => [
                            "terms" => ["field" => "host", "size" => 100],
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

        $results = $this->elasticClient->search($params);

        if (isset($results['aggregations']) && isset($results['aggregations']['users']) &&
            !empty($results['aggregations']['users']['buckets'])
        )
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
                }

                logger('Finish to '.$res['key']. ' host: ' . $item['key']);
            }

        $this->M_Config->update('last_web_users_update_id', $update_time, true);

        logger('Update the time to: '. $update_time);

        return $results;
    }


    public function get_users($search = false)
    {
        $params['index'] = 'telepath-users';
        $params['type'] = "users";
        if ($search) {
            $params['body']['query']['bool']['must'][] = ['query_string' => [  /*'default_field' => 'username',*/
                "query" => $search . '*', "default_operator" => 'AND']];
        }


        $result = $this->elasticClient->search($params);

        $results = [];

        foreach ($result['hits']['hits'] as $res) {

            $results[] = $res['_source'];
        }

        return $results;
    }

}