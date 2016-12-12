<?php

class M_Config extends CI_Model
{

    private $tableName = 'config';
    private $agentsRegexTableName = 'agents_regex';
    private $whitelistIPsTableName = 'whitelist_ip';

    function __construct()
    {

        parent::__construct();


    }

    public function changed($agents_change)
    {
        // If case of changes in network interfaces settings we need to update the elastic flag also
        if ($agents_change) {

            $params = [
                'index' => 'telepath-config',
                'type' => 'config',
                'id' => 'config_was_changed_id',
                'body' => [
                    'doc' => [
                        "value" => "1"
                    ]
                ]
            ];

            $this->elasticClient->update($params);

        }

        $redisObj = new Redis();
        $redisObj->connect('localhost', '6379');
        $redisObj->lpush("C", "1");
    }


    public function whitelist_get_ips()
    {

//        /telepath-config/ips/whitelist_id/
        $params = [
            'index' => 'telepath-config',
            'type' => 'ips',
            'id' => 'whitelist_id'
        ];

        $result = $this->elasticClient->get($params);

        return $result['_source']['ips'];
    }




    public function whitelist_set_ips($ips)

    {

        usort($ips, [$this, 'compare_from']);

        $params = [
            'index' => 'telepath-config',
            'type' => 'ips',
            'id' => 'whitelist_id',
            'body' => [
                'doc' => [
                    'ips' => $ips
                ]
            ]
        ];

        $this->elasticClient->update($params);
    }

    public function get_ip_balances()
    {

        $params = [
            'index' => 'telepath-config',
            'type' => 'ips',
            'id' => 'loadbalancerips_id'
        ];

        $result = $this->elasticClient->get($params);

        return  $result['_source']['ips'];

    }

    public function get_header_balances()
    {

        $params = [
            'index' => 'telepath-config',
            'type' => 'headers',
            'id' => 'loadbalancerheaders_id'
        ];

        $result = $this->elasticClient->get($params);

        return $result['_source']['headers'];

    }

    function compare_from($a, $b)
    {
        return strnatcmp($a['from'], $b['from']);
    }

    
    public function set_ip_balances($ips)
    {

        usort($ips, [$this, 'compare_from']);

        $params = [
            'index' => 'telepath-config',
            'type' => 'ips',
            'id' => 'loadbalancerips_id',
            'body' => [
                'doc' => [
                        'ips' => $ips
                ]
            ]
        ];

        $this->elasticClient->update($params);



    }

    public function set_header_balances($headers)
    {


        $params = [
            'index' => 'telepath-config',
            'type' => 'headers',
            'id' => 'loadbalancerheaders_id',
            'body' => [
                'doc' => [
                        'headers' => $headers
                ]
            ]
        ];

        $this->elasticClient->update($params);

    }

    public function get()
    {
        /*        GET /telepath-config/config/_search?pretty=true
        {
            "query" : {
            "match_all" : {}
            },
            "size": 98
        }*/

        /*        $params = [
                    'index' => 'telepath-config',
                    'type' => 'config',
                    'body' => [
                        'query' => [
                            'match_all' => [

                            ]
                        ]
                    ]
                ];*/


//        $result = $this->elasticClient->search($params);

        $params = [
            'index' => 'telepath-config',
            'type' => 'config',
            'body' => [
                'query' => [
                    'match_all' => [
                    ],


                ],
                "size" => '97'
            ]
        ];


        $result = $this->elasticClient->search($params);


        $results = [];
        foreach ($result['hits']['hits'] as $value) {

            $results[$value['_id']] = $value['_source']['value'];

        }
        return $results;
    }



    public function insert_to_config()
    {
        $params = $this->get();

        foreach ($params as $key => $value) {
            $par = [
                'index' => 'telepath-config',
                'type' => 'config',
                'id' => $key,
                'body' => [
                    "value" => $value
                ]
            ];
            $this->elasticClient->index($par);
        }
    }

    public function update($key, $value, $doc_as_upsert=false)
    {

        $params = [
            'index' => 'telepath-config',
            'type' => 'config',
            'id' => $key,
            'body' => [
                'doc' => [
                    'value' => $value
                ],
                'doc_as_upsert'=>$doc_as_upsert
            ],
            'refresh' => true
        ];

        $this->elasticClient->update($params);

    }

    public function get_key($key)
    {
        $params = [
            'index' => 'telepath-config',
            'type' => 'config',
            'id' => $key,
        ];
        if ($this->elasticClient->exists($params)) {
            $response = $this->elasticClient->get($params);
            if (isset($response['_source']['value']) && !empty($response['_source']['value']))
                return $response['_source']['value'];
        }
        return false;
    }




    public function insert($key, $value)
    {

        $this->db->insert($this->tableName, array('name' => $key, 'value' => $value));

    }





    public function set_agents($value)
    {


        $params = [
            'index' => 'telepath-config',
            'type' => 'interfaces',
            'id' => 'interface_id',
            'body' => [
                'doc' => [
                    'interfaces' => $value
                ]
            ]
        ];

        $this->elasticClient->update($params);
    }

    public function get_agents()
    {

        $params = [
            'index' => 'telepath-config',
            'type' => 'interfaces',
            'id' => 'interface_id'
        ];

        $result = $this->elasticClient->get($params);

        return $result['_source']['interfaces'];
    }



    public function get_regex()
    {


        $params = [
            'index' => 'telepath-config',
            'type' => 'filter_extensions',
            'id' => 'extensions_id'
        ];


        $result = $this->elasticClient->get($params);

        return $result['_source']['filter_extensions'];

    }



    public function set_regex($value)
    {

        $params = [
            'index' => 'telepath-config',
            'type' => 'filter_extensions',
            'id' => 'extensions_id',
            'body' => [
                'doc' => [
                    'filter_extensions' => $value
                ]
            ]
        ];

        $this->elasticClient->update($params);

    }




public function get_scheduler()
{

    $params = [
        'index' => 'telepath-scheduler',
        'type' => 'times',
        'body' => [
            'query' => [
                'match_all' => [

                ]
            ]
        ]
    ];

    $result = $this->elasticClient->search($params);

    return $result['hits']['hits'];
}

    public function set_scheduler($times)
    {


        $weekDay=array('Sunday'=>[],'Monday'=>[],'Tuesday'=>[],'Wednesday'=>[],'Thursday'=>[],'Friday'=>[],'Saturday'=>[]);

        $weekDay = array_merge($weekDay,$times);

        foreach ($weekDay as $day => $times) {

            $params = [
                'index' => 'telepath-scheduler',
                'type' => 'times',
                'id' => $day,
                'body' => [
                    'doc' => [
                        'times' => $times
                ]
            ]
            ];

            $this->elasticClient->update($params);

        }

    }





    public function check_file_loader_mode()
    {
        $params = [
            'index' => 'telepath-config',
            'type' => 'config',
            'id' => 'file_loader_mode_id'
        ];

        $result = $this->elasticClient->get($params);
        if ($result['_source']['value'] == "1")
            return true;
        else
            return false;
    }

    public function check_new_installation()
    {

        $query = $this->db->get('ci_users');
        if ($query->result()) {
            return false;
        }

        return true;
    }

}

?>
