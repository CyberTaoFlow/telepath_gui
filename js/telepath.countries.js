telepath.countries = {

	a2n: function (alias) {
		return typeof this.map[alias] !== 'undefined' ? this.map[alias] : 'Unknown';
	},
	n2a: function (name) {
		for(x in this.map) {
			if(this.map[x] == name || this.map[x].toLowerCase()== name) {
				return x;
			}
		}
		return '00';
	},
	map: {
	// "AP":"Asia/Pacific Region",
	"AP":"Asia/Pacific ",
	"AF":"Afghanistan",
	// "AX":"Aland Islands",
	"AL":"Albania",
	"DZ":"Algeria",
	"AS":"American Samoa",
	"AD":"Andorra",
	"AO":"Angola",
	// "AI":"Anguilla",
	"A1":"Anonymous Proxy",
	// "AQ":"Antarctica",
	// "AG":"Antigua and Barbuda",
	// "AG":"Antigua",
	"AR":"Argentina",
	"AM":"Armenia",
	"AW":"Aruba",
	"AU":"Australia",
	"AT":"Austria",
	"AZ":"Azerbaijan",
	"BS":"Bahamas",
	"BH":"Bahrain",
	"BD":"Bangladesh",
	"BB":"Barbados",
	"BY":"Belarus",
	"BE":"Belgium",
	// "BZ":"Belize",
	"BJ":"Benin",
	"BM":"Bermuda",
	"BT":"Bhutan",
	"BO":"Bolivia",
	// "BQ":"Bonaire, Saint Eustatius and Saba",
	"BA":"Bosnia/Herzegovina",
	"BW":"Botswana",
	"BV":"Bouvet Island",
	"BR":"Brazil",
	// "IO":"British Indian Ocean Territory",
	"IO":"Indian Ocean",
	"BN":"Brunei Darussalam",
	"BG":"Bulgaria",
	"BF":"Burkina Faso",
	"BI":"Burundi",
	"KH":"Cambodia",
	"CM":"Cameroon",
	"CA":"Canada",
	"CV":"Cape Verde",
	"KY":"Cayman Islands",
	// "CF":"Central African Republic",
	"CF":"Central African Rep.",
	"TD":"Chad",
	"CL":"Chile",
	"CN":"China",
	// "CX":"Christmas Island",
	// "CC":"Cocos Islands",
	"CO":"Colombia",
	"KM":"Comoros",
	"CD":"Congo",
	"CG":"Congo",
	"CK":"Cook Islands",
	"CR":"Costa Rica",
	"CI":"Cote D'Ivoire",
	"HR":"Croatia",
	"CU":"Cuba",
	"CW":"Curacao",
	"CY":"Cyprus",
	"CZ":"Czech Republic",
	"DK":"Denmark",
	"DJ":"Djibouti",
	"DM":"Dominica",
	"DO":"Dominican Republic",
	"EC":"Ecuador",
	"EG":"Egypt",
	"SV":"El Salvador",
	"GQ":"Equatorial Guinea",
	"ER":"Eritrea",
	"EE":"Estonia",
	"ET":"Ethiopia",
	"EU":"Europe",
	"FK":"Falkland Islands",
	"FO":"Faroe Islands",
	"FJ":"Fiji",
	"FI":"Finland",
	"FR":"France",
	"GF":"French Guiana",
	"PF":"French Polynesia",
	// "TF":"French Southern Territories",
	"GA":"Gabon",
	"GM":"Gambia",
	"GE":"Georgia",
	"DE":"Germany",
	"GH":"Ghana",
	"GI":"Gibraltar",
	"GR":"Greece",
	"GL":"Greenland",
	"GD":"Grenada",
	"GP":"Guadeloupe",
	"GU":"Guam",
	"GT":"Guatemala",
	"GG":"Guernsey",
	"GW":"Guinea-Bissau",
	"GN":"Guinea",
	"GY":"Guyana",
	"HT":"Haiti",
	// "HM":"Heard Island and McDonald Islands",
	"VA":"Holy See",
	"HN":"Honduras",
	"HK":"Hong Kong",
	"HU":"Hungary",
	"IS":"Iceland",
	"IN":"India",
	"ID":"Indonesia",
	"IR":"Iran",
	"IQ":"Iraq",
	"IE":"Ireland",
	"IM":"Isle of Man",
	"IL":"Israel",
	"IT":"Italy",
	"JM":"Jamaica",
	"JP":"Japan",
	// "JE":"Jersey",
	"JO":"Jordan",
	"KZ":"Kazakhstan",
	"KE":"Kenya",
	"KI":"Kiribati",
	"KP":"Korea",
	"KR":"Republic of Korea",
	"KW":"Kuwait",
	"KG":"Kyrgyzstan",
	// "LA":"Lao People's Democratic Republic",
	"LA":"Lao",
	"LV":"Latvia",
	"LB":"Lebanon",
	"LS":"Lesotho",
	"LR":"Liberia",
	"LY":"Libya",
	"LI":"Liechtenstein",
	"LT":"Lithuania",
	"LU":"Luxembourg",
	"MO":"Macau",
	"MK":"Macedonia",
	"MG":"Madagascar",
	"MW":"Malawi",
	"MY":"Malaysia",
	"MV":"Maldives",
	"ML":"Mali",
	"MT":"Malta",
	"MH":"Marshall Islands",
	"MQ":"Martinique",
	"MR":"Mauritania",
	"MU":"Mauritius",
	"YT":"Mayotte",
	"MX":"Mexico",
	// "FM":"Micronesia, Federated States of",
	"FM":"Micronesia",
	"MD":"Moldova, Republic of",
	"MC":"Monaco",
	"MN":"Mongolia",
	"ME":"Montenegro",
	// "MS":"Montserrat",
	"MA":"Morocco",
	"MZ":"Mozambique",
	"MM":"Myanmar",
	"NA":"Namibia",
	"NR":"Nauru",
	"NP":"Nepal",
	"NL":"Netherlands",
	"NC":"New Caledonia",
	"NZ":"New Zealand",
	"NI":"Nicaragua",
	"NE":"Niger",
	"NG":"Nigeria",
	"NU":"Niue",
	// "NF":"Norfolk Island",
	// "MP":"Northern Mariana Islands",
	"MP":"Mariana Islands",
	"NO":"Norway",
	"KP":"North Korea",
	"OM":"Oman",
	"O1":"Other",
	"PK":"Pakistan",
	"PW":"Palau",
	"PS":"Palestine",
	"PA":"Panama",
	"PG":"Papua New Guinea",
	"PY":"Paraguay",
	"PE":"Peru",
	"PH":"Philippines",
	"PN":"Pitcairn Islands",
	"PL":"Poland",
	"PT":"Portugal",
	"PR":"Puerto Rico",
	"QA":"Qatar",
	"RE":"Reunion",
	"RO":"Romania",
	"RU":"Russia",
	"RW":"Rwanda",
	"BL":"Saint Barthelemy",
	"SH":"Saint Helena",
	"KN":"Saint Kitts",
	"LC":"Saint Lucia",
	"MF":"Saint Martin",
	"PM":"Saint Pierre",
	"VC":"Saint Vincent",
	"WS":"Samoa",
	"SM":"San Marino",
	"ST":"Sao Tome",
	"A2":"Satellite Provider",
	"SA":"Saudi Arabia",
	"SN":"Senegal",
	"RS":"Serbia",
	"SC":"Seychelles",
	"SL":"Sierra Leone",
	"SG":"Singapore",
	"SX":"Saint Maarten",
	"SK":"Slovakia",
	"SI":"Slovenia",
	"SB":"Solomon Islands",
	"SO":"Somalia",
	"ZA":"South Africa",
	// "GS":"South Georgia and the South Sandwich Islands",
	"GS":"South Georgia",
	"KR":"South Korea",
	"ES":"Spain",
	"LK":"Sri Lanka",
	"SD":"Sudan",
	"SR":"Suriname",
	// "SJ":"Svalbard and Jan Mayen",
	// "SJ":"Svalbard",
	"SZ":"Swaziland",
	"SE":"Sweden",
	"CH":"Switzerland",
	// "SY":"Syrian Arab Republic",
	"SY":"Syria",
	"TW":"Taiwan",
	"TJ":"Tajikistan",
	// "TZ":"Tanzania, United Republic of",
	"TZ":"Tanzania",
	"TH":"Thailand",
	"TL":"Timor-Leste",
	"TG":"Togo",
	"TK":"Tokelau",
	"TO":"Tonga",
	"TT":"Trinidad and Tobago",
	"TN":"Tunisia",
	"TR":"Turkey",
	"TM":"Turkmenistan",
	// "TC":"Turks and Caicos Islands",
	"TC":"Caicos Islands",
	"TV":"Tuvalu",
	"UG":"Uganda",
	"UA":"Ukraine",
	"AE":"United Arab Emirates",
	"GB":"United Kingdom",
	// "UM":"United States Minor Outlying Islands",
	"US":"United States",
	"UY":"Uruguay",
	"UZ":"Uzbekistan",
	"VU":"Vanuatu",
	"VE":"Venezuela",
	"VN":"Vietnam",
	// "VG":"Virgin Islands, British",
	// "VI":"Virgin Islands, U.S.",
	// "VG":"Virgin Islands",
	// "WF":"Wallis and Futuna",
	// "EH":"Western Sahara",
	"YE":"Yemen",
	"ZM":"Zambia",
	"ZW":"Zimbabwe",
	"00":"Unknown"
	}

}