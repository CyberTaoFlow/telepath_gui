<?php

class Debug extends Tele_Controller
{

    function __construct()
    {

        parent::__construct();

    }

    public function index()
    {

        telepath_auth(__CLASS__, __FUNCTION__);

        $params['body'] = [
            'size' => 0,
            'aggs' => [
                'country_code' => [
                    "terms" => [
                        "field" => "country_code",
                        "size" => 200
                    ],
                ]
            ],
            'query' => [
                'bool' => [
                    'must' => [
                        ['term' => ['_type' => 'http']],
                    ]
                ],
            ],
        ];

        append_access_query($params, true);

    }


}