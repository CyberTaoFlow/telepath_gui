<?php

class M_Livesessions extends CI_Model
{

    function __construct()
    {
        parent::__construct();

    }

    function index($host)
    {

        $params['index'] = 'telepath-20*';
        $params['type'] = 'http';
        $params['body'] = [
            'size' => 0,
            "aggs" => [
                "sid" => [

                    "terms" => ["field" => "sid", "size" => 100],
                    "aggs" => [
                        "score_average" => [
                            "avg" => ["field" => "score_average"]
                        ]
                    ],

                ],
                "sid_count" => [
                    "cardinality" => ["field" => "sid"],
                ]
            ],
            'query' => [
                'bool' => [
                    'filter' => [
                        [
                            'query_string' => [
                                "fields" => ['host'],
                                "query" => $host,
                                "default_operator" => 'AND'
                            ]
                        ],
                        [
                            'range' => [
                                'ts' => ['gte' => strtotime('-1 minute')]
                            ]
                        ]
                    ]
                ],
            ],
        ];


        $params['body']["aggs"]["sid"]["aggs"]["date"] = ["max" => ["field" => "ts"]];

        $params['timeout'] = $this->config->item('timeout');

        $result = $this->elasticClient->search($params);

        $results = array('items' => array());

        $params2 = array();
        $params2['index'] = 'telepath-20*';
        $params2['type'] = 'http';
        $params2['body'] = [
            'size' => 0,
            "aggs" => [
                "country_code" => [
                    "terms" => ["field" => "country_code", "size" => 1]
                ],
                "city" => [
                    "terms" => ["field" => "city", "size" => 1]
                ],
                "ip_orig" => [
                    "terms" => ["field" => "ip_orig", "size" => 1]
                ],
                "host" => [
                    "terms" => ["field" => "host", "size" => 100]
                ],
                "cases_count" => [
                    "sum" => ["field" => "cases_count"]
                ],
                "cases_names" => [
                    "terms" => ["field" => "cases_name", "size" => 100]
                ],
                "business_actions_count" => [
                    "sum" => ["field" => "business_actions_count"]
                ],
                "business_actions_names" => [
                    "terms" => ["field" => "business_actions.name", "size" => 100]
                ],
                "alerts_count" => [
                    "sum" => ["field" => "alerts_count"]
                ],
                "alerts_names" => [
                    "terms" => ["field" => "alerts.name", "size" => 100]
                ],
                "date" => [
                    "max" => ["field" => "ts"]
                ],
                "user" => [
                    "terms" => ["field" => "username",
                        "size" => 1,
                        "order" => ["_term" => "desc"]
                    ]
                ]
            ]
        ];


        if (isset($result["aggregations"]) &&
            isset($result["aggregations"]["sid"]) &&
            isset($result["aggregations"]["sid"]["buckets"]) &&
            !empty($result["aggregations"]["sid"]["buckets"])
        ) {

            $sid_buckets = $result["aggregations"]["sid"]["buckets"];
            foreach ($sid_buckets as $sid) {

                $sid_key = $sid['key'];
                $doc_count = $sid['doc_count'];
                $score_average = $sid['score_average']['value'];

                $params3 = $params2;

                $params3['body']['query']['bool']['filter'][] = ['term' => ['sid' => $sid['key']]];

                $params3['timeout'] = $this->config->item('timeout');

                $result2 = $this->elasticClient->search($params3);

                $sid = $result2['aggregations'];

                $item = array(
                    "sid" => $sid_key,
                    "city" => $sid['city']['buckets'][0]['key'],
                    "cases_count" => $sid['cases_count']['value'],
                    "cases_names" => $sid['cases_names']['buckets'],
                    "actions_count" => $sid['business_actions_count']['value'],
                    "actions_names" => $sid['business_actions_names']['buckets'],
                    "country" => $sid['country_code']['buckets'][0]['key'],
                    "ip_orig" => $sid['ip_orig']['buckets'][0]['key'],
                    "host" => $sid['host']['buckets'],
                    "count" => $doc_count,
                    "date" => $sid['date']['value'],
                    'score_average' => $score_average,
                    "user" => $sid['user']['buckets'][0]['key'],
                    'alerts_count' => $sid['alerts_count']['value'],
                    'alerts_names' => $sid['alerts_names']['buckets']
                );


                $results['items'][] = $item;

            }
        }

        $results['total'] = $result["aggregations"]["sid_count"]["value"];
        return $results;
    }


}