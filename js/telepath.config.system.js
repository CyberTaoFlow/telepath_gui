telepath.config.system = {

	init: function () {
		
		// Get full width
		this.contentRight.addClass('tele-stacked');
		this.contentLeft.addClass('tele-stacked');
		this.contentLeft.css({ width: '100%', minWidth: '100%', height: 100, maxHeight: 100 });
		this.contentRight.css({ width: '100%', minWidth: '100%' });
		this.contentRight.append(telepath.loader);
		this.loadConfig();
		
		this.showConfigSteps();
		this.contentRight.mCustomScrollbar({ advanced:{ updateOnContentResize: true },
			scrollButtons:{ enable: false } });
		
	},
	loadConfig: function() {
		
		var that = this;
		
		telepath.ds.get('/config/get_config', { }, function (data) {
			
			that.data = data;
			that.showConfig();
			
		}, 'Error loading configuration.');
	
	},
	showConfigSteps: function () {
		
		var that = this;
		
		this.steps = [
			{ id: 'mode', label: 'Operation Mode' },
			{ id: 'reports', label: 'Reports' },
		//	{ id: 'reports', label: 'Permissions' },
		//	{ id: 'audit', label: 'Audit Logs' },
			{ id: 'network', label: 'Network' },
			// { id: 'lb', label: 'Load Balancers' },
			{ id: 'whitelist', label: 'Whitelists' },
		//	{ id: 'request', label: 'Request Analysis' },
			// { id: 'ua_ignore', label: 'UserAgent Ignore List' },
			{ id: 'ext_ignore', label: 'Extension Ignore List' },
		];
		
		this.stepContainer = $('<div>').addClass('tele-config-system-steps');
		this.contentLeft.append(this.stepContainer);

		$.each(this.steps, function(i, stepData) {
			
			var step  = $('<div>').addClass('tele-config-system-step').attr('id', 'tele-config-step-' + stepData.id);
			var index = $('<div>').addClass('tele-config-system-step-index').html(i + 1);
			var lbl   = $('<div>').addClass('tele-config-system-step-label').html(stepData.label);
			
			step.append(index).append(lbl);
			
			that.stepContainer.append(step);
			
			var arrow = $('<div>').addClass('tele-config-system-step-arrow');
			if(i == 0) {
				step.addClass('active');
			}
			if(i !== that.steps.length - 1) {
				that.stepContainer.append(arrow);
			}
			
			step.click(function () {
				
				var stepId = $(this).attr('id').split('-')[3];
				$('.tele-config-system-tab').hide();
				$('.tele-config-system-' + stepId).show();
				
				// Paint it orange..
				$('.active', that.stepContainer).removeClass('active'); // Cleanup
				$(this).addClass('active'); // Self
				$(this).prevAll().addClass('active'); // Previous
				$('.tele-config-content-right').mCustomScrollbar('update');
				
			});

		});
		
		$(window).resize(function () {
			
			if($('.tele-config-system-steps').size() > 0) {
				setTimeout(function() {
					telepath.config.system.updWidth();
				}, 100);
			}
			
		});
		
		this.updWidth();
	
	},
	updWidth: function() {
		
		var mid_width  = ($('.tele-config-system-step').outerWidth() * (this.steps.length)) / 2;
		var mid_screen = this.stepContainer.parent().width() / 2;
	
		this.stepContainer.css({ marginLeft: mid_screen - mid_width - 40 });
	
	},
	saveConfig: function() {
		
		var that = this;

		//calEvents = that.cal.weekCalendar("getEvents");
		//console.log($(that.scheduler).data);
	
		// Build output data object
		var data = {};
		
		// Input Mode
	
		var t_engine  = this.telepathEngineToggle.data('tele-toggleFlip').options.flipped;	
		var t_inline  = this.reverseProxyToggle.data('tele-toggleFlip').options.flipped;
		var t_sniffer = this.snifferToggle.data('tele-toggleFlip').options.flipped;
		data.engine_mode = (t_engine) ? 1: 0;
		data.sniffer_mode = (t_sniffer) ? 1: 0;
		data.reverse_proxy_mode = (t_inline) ? 1: 0;
		
		data.input_mode = 'off';
		
		if(t_sniffer && t_inline) {
			data.input_mode = 'both';
		} else {
			if(t_inline)  { data.input_mode = 'inline'; }
			if(t_sniffer) { data.input_mode = 'sniffer';  }
		}
		
		// Operation Mode
		var selected_opmod = this.opmod.data('tele-teleRadios').options.checked;
		switch(selected_opmod) {
			case 'training':   data.operation_mode_id = 1; break;
			case 'production': data.operation_mode_id = 2; break;
			case 'hybrid':     data.operation_mode_id = 3; break;
		}


		data.moveToProductionAfter = $('input', this.moveToProductionAfter).val();
		
		// Reports
	
		data.addUnknownApp = this.addUnknownAppToggle.data('tele-toggleFlip').options.flipped ? 1 : 0;

		// Syslog
		data.write_to_syslog  = this.syslogToggle.data('tele-toggleFlip').options.flipped ? 1 : 0;
		data.remote_syslog_ip = $('input', this.syslogIP).val();
				
		// Proxy
		data.proxy_flag = this.proxyToggle.data('tele-toggleFlip').options.flipped ? 1 : 0;
		data.proxy_ip   = $('input', this.proxyIP).val();
		data.proxy_port = $('input', this.proxyPort).val();
		
		// SMTP
		data.smtp      = $('input', this.smtpServer).val();
		data.smtp_port = $('input', this.smtpPort).val();
		data.rep_user  = $('input', this.smtpUser).val();
		data.rep_pass  = $('input', this.smtpPass).val();
		
		
		
		// Load Balancer
		// IPS
		data.load_balancer_on = this.lbToggle.data('tele-toggleFlip').options.flipped ? 1 : 0;
		data.load_balancer_ip = [];
		$('.tele-ip', this.lbIPs).each(function () {
			var ip = $(this).data('tele-ip').getIP();
			if(ip) {
				data.load_balancer_ip.push(ip);
			}
		});
		
		// De-Dupe
		data.load_balancer_ip = data.load_balancer_ip.filter(function(elem, pos) {
			return data.load_balancer_ip.indexOf(elem) == pos;
		});
		data.load_balancer_ip = data.load_balancer_ip.join(',');
		
		// Headers
		data.load_balancer_header = [];
		$('input', this.lbHeaders).each(function () {
			var value = $(this).val();
			if(value != '') {
				data.load_balancer_header.push(value);
			}
		});
		data.load_balancer_header = data.load_balancer_header.join(',');
		
		
		// IP Whitelist
		data.whitelist = [];

		$('.tele-ip-wrap', this.whitelist).each(function () {
					
			var is_range = $('.tele-mini-toggle', this).data('tele-toggleFlip').options.flipped;
			
			var ip_start = $('.tele-ip:first', this).data('tele-ip').getIP();
			var ip_end   = $('.tele-ip:last', this).data('tele-ip').getIP();
			
			if(is_range) {
				if(ip_start && ip_end && ip2long(ip_start) < ip2long(ip_end)) {
					data.whitelist.push({from: ip_start ,to: ip_end});
				}
			} else {
				if(ip_start) {
					data.whitelist.push({from:ip_start,to: ip_start});
				}
			}

		});
		
		// De-Dupe
		data.whitelist = data.whitelist.filter(function(elem, pos) {
			return data.whitelist.indexOf(elem) == pos;
		});
		
		data.agents = [];
		// Network Interfaces
		$('.tele-network-wrap', this.interfaces).each(function () {
		
			//var IDX  = $('.tele-network-idx', this).html();
			var NAME = $('.tele-network-name input', this).val();
			var ETH  = $('.tele-network-select', this).val();
			var MASK = $('.tele-network-filter input', this).val();
			
			data.agents.push({ /*idx: IDX,*/ agent_name: NAME, NetworkInterface: ETH, pcap_filter: MASK });

		});

		data.regex = { headers: '', URL: '' };
				
		var useragents = [];
		// User Agent Ignore List
		$('.tele-input input', this.useragents).each(function () {
			if($(this).val() != '') {
				useragents.push($(this).val());		
			}
		});
		
		var URL = [];
		// Extension Ignore List
		$('.tele-input input', this.extentsions).each(function () {
			if($(this).val() != '') {
				URL.push($(this).val());		
			}
		});
		
		if(useragents.length > 0) {
			useragents = useragents.join(")|(");
			useragents = "(User-Agent:)(.*)(("+ useragents +"))";
			data.regex.headers = useragents;
		}

		if(URL.length > 0) {
			//URL = URL.join(")|(\\.");
			//URL = "(\\." + URL + ")";
			data.regex.URL = URL;
		}
		
		telepath.ds.get('/config/set_config', data, function (data) {
			
			that.data = data;
			that.showConfig();
			
			telepath.dialog({ msg: 'Configuration Saved' });
			
		}, 'Error saving configuration.');
		
	},
	updateEngineStatus: function () {
		if($(telepath.config.system.telepathEngineToggle).size() > 0) {
			telepath.ds.get('/telepath/get_engine_status', { }, function (data) {
				if ($(telepath.config.system.telepathEngineToggle).data('teleToggleFlip').options)
				{
					$(telepath.config.system.telepathEngineToggle).data('teleToggleFlip').options.flipped = data.status;
				}
				$(telepath.config.system.telepathEngineToggle).data('teleToggleFlip')._update();
			});
		}
	},
	parseRanges: function(eventsData) {
		
		var events = [];
		
		function GetDaysOfWeek(date) {
			var days = new Array();
			for (var i = 0; i < 7; i++)
			{
				var tmp = new Date(date);
				days[i] = new Date(tmp.setDate(tmp.getDate() - tmp.getDay() + i));
			}
			return days;
		}
		
		var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		
		var today = new Date();
		today.setMinutes(0);
		today.setSeconds(0);
		var days = GetDaysOfWeek(today);
		
		var index = 0;
		
		$.each(days, function(i, date) {
			
			var n = weekday[date.getDay()];
		
			var tracking = false;
			
			var current_to = false;
			var current_from = false;
			$.each(eventsData[n], function(num, val) {
				i = parseInt(num.substring(1));
				if(val == '1') {
					date.setHours(i);
					date.setMinutes(0);
					date.setSeconds(0);
					current_from = new Date(date);
					date.setHours(i + 1);
					current_to   = new Date(date);
					events.push({ id: index, start: current_from, end: current_to, title: '' });
					index++;
				}
			});
		});

/*	
			$.each(eventsData[n], function(num, val) {
				i = parseInt(num.substring(1));
				if(val == '1') {
					
					if(tracking == true) {
						if(i < 23) {
							date.setHours(i + 1);
						} else {
							date.setMinutes(59);
						}
						current_to   = new Date(date);
						
					} else {
					
						date.setHours(i);
						current_from = new Date(date);
						
						if(i < 23) {
							date.setHours(i + 1);
						} else {
							date.setMinutes(59);
						}
						
						current_to   = new Date(date);
					}
					tracking = true;
					
				} else {
				
					if(tracking == true) {
						events.push({ id: index, start: current_from, end: current_to, title: '' });
						index++;
						current_from = false;
						current_to = false;
					}
					
					tracking = false;
					
				}
				
			});
			
			if(current_from && current_to) {
				events.push({ id: index, start: current_from, end: current_to, title: '' });
				index++;
			}
		
		});
*/
		
		return events;
		
	},
	showConfig: function () {
		
		var that = this;
	
		// Container		
		this.contentRight.empty();
		this.container = $('<div>').addClass('tele-config-container').appendTo(this.contentRight);
		
		// -----------------------------------------------------------
		// Operation Mode
		// -----------------------------------------------------------
		this.c_mode = $('<div>').addClass('tele-config-system-tab tele-config-system-mode');
		this.container.append(this.c_mode);
		
		$('<div>').addClass('tele-title-1').html('Operation Mode ID').appendTo(this.c_mode);

		var selected_opmod = '';
		switch(this.data.operation_mode_id) {
			case '1':	selected_opmod = 'training';   break;
			case '2':	selected_opmod = 'production'; break;
			case '3':	selected_opmod = 'hybrid';	   break;
		}
		
		this.scheduler = $('<div>').addClass('tele-scheduler').appendTo(this.c_mode);
		
		this.opmod = $('<div>').teleRadios({ 
		checked: selected_opmod,
		radios: [ 
			{ key: 'training',   label: 'Training' },
			{ key: 'hybrid',     label: 'Hybrid' },
			{ key: 'production', label: 'Production' },
		], callback: function(radio) {
			
			if(radio.key == 'hybrid') {
				that.scheduler.show();
			} else {
				that.scheduler.hide();
			}
			
		}}).addClass('tele-config-opmod').appendTo(this.c_mode);
		
		telepath.ds.get('/config/get_scheduler', { mode: "get_schedule" }, function(data) {
			
			var eventData = { events : that.parseRanges(data.scheduler)	};
			that.cal = $(that.scheduler).weekCalendar({
		
				timeslotsPerHour: 1,
				timeslotHeight: 15,
				defaultEventLength: 1,
				data: eventData,
				height: function($calendar) {
					return 400;
				},
				resizable : function(calEvent, element) { return false;},
				// event drag is disabled. the user had to remobe old and create new event
				draggable : function(calEvent, element) { return false;},
				eventDelete: function(calEvent, element, dayFreeBusyManager,
                                                      calendar, clickEvent) {
					calendar.weekCalendar('removeEvent',calEvent.id);
					telepath.ds.get('/config/del_scheduler_event', { mode: "get_schedule", 'event': calEvent.start });
				},
				eventNew: function(calEvent, element, dayFreeBusyManager, calendar, mouseupEvent) {
					telepath.ds.get('/config/add_scheduler_event', { mode: "get_schedule", 'event': calEvent.start });
				}
			});
					
		}, 'Error while trying to get the scheduler.');

		// MV2Prod after
		this.moveToProductionAfter = $('<div>').teleInput({ 
			label: 'Move to production after', 
			suffix: 'Requests', 
			width: 70, 
			value: this.data.moveToProductionAfter 
		}).addClass('tele-config-mv2prod').appendTo(this.c_mode); 

		$('<div>').addClass('tele-title-1').html('Learn new apps').appendTo(this.c_mode);
                this.addUnknownAppToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.addUnknownApp == '1' }).addClass('tele-addUnknownApp-toggle').appendTo(this.c_mode);

                $('<p>').html('ETA: ' + this.data.eta_id ).appendTo(this.c_mode);

		// Wrapper
		this.engineControls = $('<div>').addClass('tele-engine-controls').appendTo(this.c_mode);
		
		// Engine
		$('<div>').addClass('tele-title-2').html('Telepath Engine').appendTo(this.engineControls);
		
		this.telepathEngineToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.engine_mode == '1', flip: function (value) {
			
			telepath.ds.get('/telepath/set_engine_' + (value ? 'start' : 'stop'), { }, function (data) {
			
			});
		
		} }).appendTo(this.engineControls);
		
		// Rev-Proxy
		$('<div>').addClass('tele-title-2').html('Reverse Proxy').appendTo(this.engineControls);
		this.reverseProxyToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.reverse_proxy_mode_id == "1" }).appendTo(this.engineControls);
		
		// Sniffer
		$('<div>').addClass('tele-title-2').html('Sniffer').appendTo(this.engineControls);
		this.snifferToggle 		= $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.sniffer_mode == "1" }).appendTo(this.engineControls);
		
		// Sniffer
		$('<div>').addClass('tele-title-2').html('Webservice').appendTo(this.engineControls).css({ opacity: 0.3 });
		this.webserviceToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', disabled: true }).appendTo(this.engineControls);
		
				
		// TODO:: Scheduler
		
		// -----------------------------------------------------------
		// Reports
		// -----------------------------------------------------------
		this.c_reports = $('<div>').addClass('tele-config-system-tab tele-config-system-reports');
		this.container.append(this.c_reports);
		
		// $('<div>').addClass('tele-title-1').html('Reports').appendTo(this.c_reports);
		
		// -----------------------------------------------------------
		// SYSLOG
		// -----------------------------------------------------------
		
		$('<div>').addClass('tele-title-1').html('Syslog').appendTo(this.c_reports).addClass('tele-title-syslog');
		this.syslogToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.write_to_syslog == '1' }).addClass('tele-syslog-toggle').appendTo(this.c_reports);
		this.syslogIP     = $('<div>').teleInput({ label: 'Server', width: 120, value: this.data.remote_syslog_ip }).addClass('tele-config-syslog-host').appendTo(this.c_reports); 
		
		// -----------------------------------------------------------
		// Proxy
		// -----------------------------------------------------------
		this.c_network = $('<div>').addClass('tele-config-system-tab tele-config-system-network');
		this.container.append(this.c_network);
		
		$('<div>').addClass('tele-title-1').html('Proxy').appendTo(this.c_reports).addClass('tele-title-proxy');
		
		this.proxyToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.proxy_flag == '1' }).appendTo(this.c_reports);
		this.proxyIP     = $('<div>').teleInput({ label: 'Server', width: 120, value: this.data.proxy_ip }).addClass('tele-config-proxy-host').appendTo(this.c_reports); 
		this.proxyPort   = $('<div>').teleInput({ label: 'Port', width: 70, value: this.data.proxy_port }).addClass('tele-config-proxy-port').appendTo(this.c_reports); 
		
		// -----------------------------------------------------------
		// SMTP
		// -----------------------------------------------------------
		$('<div>').addClass('tele-title-1').html('SMTP').appendTo(this.c_reports);
		
		this.smtpServer = $('<div>').teleInput({ label: 'Server'  , width: 200, value: this.data.smtp      }).addClass('tele-config-smtp-host').appendTo(this.c_reports); 
		this.smtpPort   = $('<div>').teleInput({ label: 'Port'    , width: 70,  value: this.data.smtp_port }).addClass('tele-config-smtp-port').appendTo(this.c_reports); 
		this.smtpUser   = $('<div>').teleInput({ label: 'Username', width: 200, value: this.data.rep_user  }).addClass('tele-config-smtp-username').appendTo(this.c_reports); 
		this.smtpPass   = $('<div>').teleInput({ label: 'Password', width: 200, value: this.data.rep_pass, pass: true  }).addClass('tele-config-smtp-password').appendTo(this.c_reports); 
		
		
		// SMTP Test button
		this.smtpTestEmail = $('<div>').teleInput({ label: 'Test Email', width: 200 }).css({ 'marginTop': 20 }).addClass('tele-config-smtp-test').appendTo(this.c_reports); 
		var testSMTP   = $('<a href="#" class="tele-button tele-button-apply">Test</a>').click(function () {
			
			var email = $('input', that.smtpTestEmail).val();

			function validateEmail(email) {
				var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
				return re.test(email);
			}
			
			if(validateEmail(email)) {
											
				if($('input', that.smtpServer).val() == '') {
					telepath.dialog({ msg: 'SMTP Server cant be blank.' });
					return;
				}
				
				telepath.ds.get('/config/testmail', { 
					'smtp':		 $('input', that.smtpServer).val(),
					'smtp_port': $('input', that.smtpPort).val(),
					'smtp_user': $('input', that.smtpUser).val(),
					'smtp_pass': $('input', that.smtpPass).val(),
					'test_mail': email
				}, function(data) {
					
					telepath.dialog({ msg: 'Test mail was sent.' });
				
				}, 'Error while trying to send test mail');
				
				$('input', that.smtpTestEmail).val('');
				
			} else {
				
				telepath.dialog({ msg: 'Invalid mail supplied.' });
			
			}
			
		}).css({ 'float': 'left','padding': '4px 10px', 'margin-top': '26px' }).h().appendTo(this.c_reports);
		
		
		// -----------------------------------------------------------
		// Load Balancer
		// -----------------------------------------------------------
		
		this.c_lb = $('<div>').addClass('tele-config-system-tab tele-config-system-lb');
		this.container.append(this.c_lb);
		
		$('<div>').addClass('tele-title-1').html('Load Balancer').appendTo(this.c_lb);
		
		this.lbToggle = $('<div>').toggleFlip({ left_value: 'Off', right_value: 'On', flipped: this.data.load_balancer_on == '1' }).appendTo(this.c_lb);
		this.lbIPs     = $('<div>').teleMulti({ values: this.data.load_balancer_ip.split(','), title: 'Load Balancer IPs', template: function(element, value) {
			element.ip({ data: value });
		} }).appendTo(this.c_lb).addClass('tele-config-balancer-ips');
		this.lbHeaders     = $('<div>').teleMulti({ values: this.data.load_balancer_header.split(','), title: 'Load Balancer Headers', template: function(element, value) {
			element.teleInput({ value: value });
		} }).appendTo(this.c_lb).addClass('tele-config-balancer-headers');
		
		// -----------------------------------------------------------
		// IP Whitelist
		// -----------------------------------------------------------
		
		this.c_whitelist = $('<div>').addClass('tele-config-system-tab tele-config-system-whitelist');
		this.container.append(this.c_whitelist);
		
		
		
		$.each(this.data.whitelist, function (i, ip) {
			that.c_whitelist.append(getRangeUI(ip, that.c_whitelist));
		});
		
		// Another blank
		this.c_whitelist.append(getRangeUI('', that.c_whitelist));
		
		
		//this.whitelist = $('<div>').teleMulti({ values: .length > 0 ? this.data.whitelist : [ '' ], title: 'IP Whitelist', template: function(element, value) {
		//	element.ip({ data: value });
		//} }).appendTo();
		
		
		// -----------------------------------------------------------
		// Network Interfaces
		// -----------------------------------------------------------
		this.interfaces = $('<div class="interfaces">').teleMulti({ values: this.data.agents, title: 'Network Interfaces', template: function(element, value) {
			
			element.addClass('tele-network-wrap');
			var Wrap      = element;			
			//var IDX       = $('<div>').html(value.idx).addClass('tele-network-idx');
			var Name      = $('<div>').teleInput({ label: 'Name', width: 120, value: value.agent_name }).addClass('tele-network-name');
			var Filter    = $('<div>').teleInput({ label: 'Filter Expression', width: 120, value: value.pcap_filter }).addClass('tele-network-filter');
			var Interface = $('<select>').addClass('tele-network-select');
			
			Wrap.append(Name).append(Filter).append(Interface);
			$.each(telepath.config.system.data.interfaces, function (i, interfaceName) {
				var selected = interfaceName == value.NetworkInterface ? 'selected="selected"' : '';
				Interface.append('<option ' + selected + ' value=' + interfaceName + '>' + interfaceName + '</option>');
			});
			
			//element.append(Wrap);
			
		} }).appendTo(this.c_network);
	
		// -----------------------------------------------------------
		// User Agent Ignore List
		// -----------------------------------------------------------
		/* Parse out user agents, little tricky.. */
		this.c_ua = $('<div>').addClass('tele-config-system-tab tele-config-system-ua_ignore');
		this.container.append(this.c_ua);
		
		
		var headers = this.data.regex.headers ? this.data.regex.headers : '';
		var pos     = headers.indexOf('((');
		var len     = headers.length;
		var parsed  = headers.substr(pos + 2, len - pos - 4).split(')|(');
		this.useragents = $('<div>').teleMulti({ values: parsed, title: 'User Agent Ignore List', template: function(element, value) {
			element.teleInput({ value: value });
		} }).appendTo(this.c_ua);
	
		// -----------------------------------------------------------
		// Extension Ignore List
		// -----------------------------------------------------------
		this.c_ext = $('<div>').addClass('tele-config-system-tab tele-config-system-ext_ignore');
		this.container.append(this.c_ext);
		
		/* Parse out ext ignore list */
		//var URL    = this.data.regex.URL ? this.data.regex.URL : '';
		//var parsed = URL.substring(3,URL.length-1).split(")|(\\.");
		var regex = this.data.regex ? this.data.regex : '';

		this.extentsions = $('<div>').teleMulti({ values: regex, title: 'Extension Ignore List', template: function(element, value) {
			element.teleInput({ value: value });
		} }).appendTo(this.c_ext);
		
		// -----------------------------------------------------------
		// Save / Cancel Buttons
		// -----------------------------------------------------------
		
		var btnContain = $('<div>').addClass('tele-button-container').appendTo(this.container);
		var saveBtn   = $('<a href="#" class="tele-button tele-button-apply">Save</a>');
		var cancelBtn  = $('<a href="#" class="tele-button tele-button-cancel">Cancel</a>');
		
		btnContain.append(saveBtn).append(cancelBtn);
		
		// Callbacks
		saveBtn.click(function (e) {
			e.preventDefault();
			that.saveConfig();
		});
		
		cancelBtn.click(function (e) {
			e.preventDefault();
			that.loadConfig();
		});
		
		$('.tele-config-system-tab').hide();
		$('.tele-config-system-mode').show();
			
		// Updates engine status every 5 seconds
		//if(telepath.config.system.engineTimer) { clearInterval(telepath.config.system.engineTimer);	}
		//telepath.config.system.engineTimer = setInterval(function () { that.updateEngineStatus(); }, 5000);
		//this.container.mCustomScrollbar({ advanced:{ updateOnContentResize: true } });	
	}
	
}
