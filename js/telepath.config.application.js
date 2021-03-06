telepath.config.application = {
	validate: function() {
		
		var that = this;
		
		// Start collecting information for data save
		// Validate user input, if errors - alerts + prevent form submission
		
		var app_data = {};
		
		/* APPLICATION DETAILS */
		/* *************************************************************** */
		$('#tele-app-details').click();
		
		// APP DOMAIN
		app_data.host = $('input', this.AD_app_domain).val();
		$('input', this.AD_app_domain).css({ borderColor: '#555' });
		if(app_data.host.length > 256) {
			telepath.dialog({ type: 'alert', title: 'Application Settings', msg: 'Application host too long' });
			$('input', this.AD_app_domain).css({ borderColor: 'red' });
			return false;
		}
		if(app_data.host == '') {
			telepath.dialog({ type: 'alert', title: 'Application Settings', msg: 'Application host cant be empty' });
			$('input', this.AD_app_domain).css({ borderColor: 'red' });
			return false;
		}


		// Added automatically toggle
		app_data.top_level_domain = this.TopLevelDomainAppToggle.data('tele-toggleFlip').options.flipped ? 1 : 0;



		//Operation Mode ID

		var selected_opmod = this.opmod.data('tele-teleRadios').options.checked;
		switch(selected_opmod) {
			case 'training':   app_data.operation_mode = 1; break;
			case 'production':     app_data.operation_mode = 2; break;
			case 'hybrid':     app_data.operation_mode = 3; break;

		}

		app_data.move_to_production = $('input', this.move_to_production).val();

		if(app_data.move_to_production == '') {
			telepath.dialog({ type: 'alert', title: 'Application Settings', msg: 'Application move to production field cant be empty' });
			$('input', this.move_to_production).css({ borderColor: 'red' });
			return false;
		}
		
		// DISPLAY NAME
		app_data.display_name = $('input', this.AD_display_name).val();
		$('input', this.AD_display_name).css({ borderColor: '#555' });
		if(app_data.display_name.length > 64) {
			$('input', this.AD_display_name).css({ borderColor: 'red' });
			telepath.dialog({ type: 'alert', title: 'Application Settings', msg: 'Application display name too long' });
			return false;
		}
		
		// COOKIES
		app_data.AppCookieName = [];
		// Collect
		$('input', this.app_cookies).each(function () {
			if($(this).val() != '') {
				app_data.AppCookieName.push($(this).val());
			}
		});
		// De-Dupe
		app_data.AppCookieName = app_data.AppCookieName.filter(function(elem, pos) {
			return app_data.AppCookieName.indexOf(elem) == pos;
		});
		// Join
		app_data.AppCookieName = app_data.AppCookieName.join(',');
		
		// IPS
		app_data.app_ips = [];
		$('.tele-input', this.app_ips).each(function () {
			//var ip = $(this).data('tele-ip').getIP();
			var value = $('input',this);
			if(value[0].value != '') {
				app_data.app_ips.push(value[0].value + (value[1].value ? ':' + value[1].value : ''));
			}
		});
		// De-Dupe
		app_data.app_ips = app_data.app_ips.filter(function(elem, pos) {
			return app_data.app_ips.indexOf(elem) == pos;
		});
		// Join
		app_data.app_ips = app_data.app_ips.join(',');
		
		/* AUTHENTICATION */
		/* *************************************************************** */
		$('#tele-app-auth').click();
		
		//app_data.ntlm_mode        = 0;
		app_data.basic_mode  = 0;
		//app_data.form_flag   = 0;
		app_data.digest_mode = 0;
		


		app_data.ssl_flag = this.app_ssl_toggle.data('teleTeleRadios').options.checked == "ON" ? 1 : 0;
		app_data.app_ssl_certificate = $('input', this.app_ssl_certificate).data('file');
		app_data.app_ssl_private = $('input', this.app_ssl_private).data('file');
		app_data.ssl_server_port = $('input', this.app_ssl_port).val();

		// Success Criteria -- Toggle
		//app_data.form_authentication_flag = this.SC_toggle.teleRadios('option', 'checked') == 'ON' ? 1 : 0;

		// Success Criteria -- Cookie
		app_data.cookie_mode = this.SC_cookie_toggle.data('teleTeleRadios').options.checked == "ON" ? 1 : 0;
		app_data.cookie_name = $('input', this.SC_cookie_name).val();
		app_data.cookie_value = $('input', this.SC_cookie_value).val();
		app_data.cookie_value_appearance = this.SC_cookie_flag.data('teleTeleRadios').options.checked == 'appears' ? 1 : 0;

		// Success Criteria -- Redirect
		//app_data.redirect_mode = this.SC_redirect_toggle.data('teleTeleRadios').options.checked == "ON" ? 1 : 0;
		//app_data.redirect_page = this.SC_redirect_browse.teleBrowse('option', 'filename');
		////app_data.form_authentication_redirect_page_id   	 = this.SC_redirect_browse.teleBrowse('option', 'id');
		//app_data.redirect_status_code = this.SC_redirect_range.data('tele-teleInput').input.val();

		// Success Criteria -- Body Value
		app_data.body_value_mode = this.SC_body_toggle.data('teleTeleRadios').options.checked == "ON" ? 1 : 0;
		app_data.body_value_html = this.SC_body_input.data('tele-teleInput').input.val();

		if(that.app_id=='new'){
			app_data.learning_so_far='0';
			app_data.subdomains='';
			app_data.eta='1d 0h 0m';
		}
		var mode = this.userIdentification.data('teleTeleRadios').options.checked;

		switch(mode) {
			/*case 'NTLM':
				app_data.ntlm_mode = 1;

				if ((!app_data.cookie_mode || (!app_data.cookie_name || app_data.cookie_name == ''))
					&& (!app_data.body_value_mode || (!app_data.body_value_html || app_data.body_value_html == ''))) {
					telepath.dialog({
						type: 'alert',
						title: 'Application Settings',
						msg: 'You need to fill cookie name or body value.'
					});
					return false;
				}
				break;*/
			case 'Basic':
				app_data.basic_mode = 1;

				if ((!app_data.cookie_mode || (!app_data.cookie_name || app_data.cookie_name == ''))
					&& (!app_data.body_value_mode || (!app_data.body_value_html || app_data.body_value_html == ''))) {
					telepath.dialog({
						type: 'alert',
						title: 'Application Settings',
						msg: 'You need to fill cookie name or body value.'
					});
					return false;
				}
				break;
			case 'Form':
				app_data.form_flag = 1;

				// Username parameter is required here
				app_data.form_param_name = $('input', this.usernameParameter).val();

				// unknown
				//app_data.form_param_id   = this.usernameParameter.teleBrowse('option', 'id');

				$('input', this.usernameParameter).css({ borderColor: '#555' });
				if(!app_data.form_param_name || app_data.form_param_name == '' || app_data.form_param_name.length > 64 || parseInt(app_data.form_param_id) == 0) {
					$('input', this.usernameParameter).css({ borderColor: 'red' });
					telepath.dialog({ type: 'alert', title: 'Application Settings', msg: 'Application authentication username parameter is missing.' });
					return false;
				}

                if ((!app_data.cookie_mode || (!app_data.cookie_name || app_data.cookie_name == ''))
					&& (!app_data.body_value_mode || (!app_data.body_value_html || app_data.body_value_html == ''))) {
					telepath.dialog({
						type: 'alert',
						title: 'Application Settings',
						msg: 'You need to fill cookie name or body value.'
					});
					return false;
				}
				//console.log(app_data);

				break;
			case 'Digest':
				app_data.digest_mode = 1;

                if ((!app_data.cookie_mode || (!app_data.cookie_name || app_data.cookie_name == ''))
					&& (!app_data.body_value_mode || (!app_data.body_value_html || app_data.body_value_html == ''))) {
					telepath.dialog({
						type: 'alert',
						title: 'Application Settings',
						msg: 'You need to fill cookie name or body value.'
					});
					return false;
				}
				break;
			//default:
			//	// By default automatic mode is selected
			//break;
		}

		telepath.ds.get('/applications/set_app', app_data, function (data) {
			if (data.success){
				telepath.config.applications.reload();
				// Empty right screen, in case of engine change rejection (for example from production
				// mode to hybrid mode)
				that.container.empty();
				$('.tele-config-bar-right ul').remove();
				//that.editApp(app_data.host);
				telepath.dialog({msg:'Application successfully updated'});
			}

		});
		
	},
	createApp: function() {

		this.editApp('new');
	},


	editApp: function(app_id, $nodeParent) {
		
		var that = this;

		this.nodeParent=$nodeParent;
		// Containers
		this.container = telepath.config.applications.contentRight;
		this.toolbar   = telepath.config.applications.barRight;
		
		// Cleanup
		this.container.empty();
		$('.tele-config-bar-right ul').remove();

		// Tab Containers
		this.tabsEl   = $('<div>').addClass('tabs');
		this.tabsUl   = $('<ul>');
		this.tabsEl.append(this.tabsUl);
		
		// Tab Declaration
		var tabs = [
			{ id: 'details', text: 'Application Details' },
			// remove Pages and Parameters for now (Yuli)
			//{ id: 'params', text: 'Pages and Parameters' },
			{ id: 'auth', text: 'Authentication' },
			{ id: 'ssl', text: 'SSL' },
			// remove advanced field for now, Yuli
			//{ id: 'advanced', text: 'Advanced' }
		];
		
		// Tab Print
		for(x in tabs) {
			var tab = tabs[x];
			var tabEl = $('<div>').attr('id', 'tele-app-' + tab.id);
			var tabLi = $('<li>');
			var tabA  = $('<a>').attr('href', '#tele-app-' + tab.id).text(tab.text);
			tabLi.append(tabA);
			this.tabsUl.append(tabLi);
			this.tabsEl.append(tabEl);
			
			if(app_id == 'new' && tab.id != 'details')  {
				//tabLi.hide();
			}
			
		}
		
		// Buttons
		
		this.buttonsEl = $('<div>').addClass('tele-form-buttons');
		this.applyBtn  = $('<a class="tele-button tele-button-apply">Save</a>');
		this.cancelBtn = $('<a class="tele-button tele-button-cancel">Cancel</a>');
		
		this.buttonsEl.append(this.applyBtn).append(this.cancelBtn);
		//this.container.append(this.buttonsEl);
		
		// BIND Validate
		this.applyBtn.click(function () { 
			that.validate(that);
		});
		
		// BIND Cancel -- Simply reload
		this.cancelBtn.click(function () {
			that.editApp(that.app_id);
		});
		
		// Append and init Tabs
		this.container.append(this.tabsEl);
		this.container.append(this.buttonsEl);
		this.tabsEl.tabs({ 
		
			heightStyle: 'fill',
			autoHeight: false,
			animate: false,
			activate: function( event, ui ) {
				if(ui.newPanel.selector == "#tele-app-params" /* && ui.newPanel.text() == '' */) {
					that.showPagesParams();
				}
			}
			
		});
		if ($(window).height() < 800) {

			this.buttonsEl.css({'margin-top': 0});
			var tabs = $('.ui-tabs-panel');
			tabs.height(tabs.height() + 70);
		}

		this.toolbar.append(this.tabsUl);

                this.app_id = app_id;
		
                // New Application Template
                this.app_data = {
                                app_domain: '',
                                display_name: '',
                                // Add default cookies for new app
								// Not needed. We get it from server side (Moshe)
                                //cookie_suggestion: 'PHPSESSID,PHPSESSIONID,JSESSIONID,ASPSESSIONID,ASP.NET_SessionId,VisitorID,SESS',
								//ip_suggestion: '',
                                app_ips: '',
                                form_param_name: '',
                                form_param_id: '',
                                //ntlm_mode: 0,
                                basic_mode: 0,
                                form_flag: 0,
                                digest_mode: 0,
                                cookie_mode: 0,
                                cookie_name: '',
                                cookie_value: '',
                                ssl_flag: 0,
                                AppCookieName: '',
                                //redirect_status_code: '',
								operation_mode: '1',
								eta: '1d 0h 0m',
								top_level_domain: '1',
								move_to_production: 1000000
		};
	
		if(app_id == 'new') {
			this.showApp('new');
		} else {
			// Load Application
			this.loadApp(app_id);

		}
		
	},
	loadApp: function (app_host) {

		var that = this;
		$('#tele-app-details').append(telepath.loader);

		telepath.ds.get('/applications/get_app', {host: app_host}, function (data) {

			if (data.items) {
				that.app_data = data.items;
				$('#tele-app-details').empty();
				that.showApp();
			}
		});

	},
	showPagesParams: function() {
		$("#tele-app-params").html('');
		this.teleBrowser = $('<div>').teleBrowser({ root: { type: 'application', id: this.app_id } });
		this.teleBrowserTitle = $('<div>').addClass('tele-title-1').html('Pages and Parameters List');		
		$("#tele-app-params").append(this.teleBrowserTitle).append(this.teleBrowser);
		
	},
	showApp: function (state) {
		
		var that = this;
		
		// Application Details
		
		var title = $('<div>').addClass('tele-title-1').html('Application Details').appendTo('#tele-app-details');

		this.AD_app_domain = $('<div>').teleInput({
			label: 'Application Host',
			value: decodeEntities(that.app_data.host),
			disabled: state != 'new'
		});
		this.AD_display_name = $('<div>').teleInput({label: 'Display Name', value: decodeEntities(that.app_data.display_name)});

		$('#tele-app-details').append(this.AD_app_domain).append(this.AD_display_name);


		this.c_mode = $('<div>').addClass('tele-config-system-tab tele-config-system-mode');
		this.container.append(this.c_mode);

		$('<div>').addClass('tele-title-1 ').html('Top Level Domain').appendTo('#tele-app-details');
		this.TopLevelDomainAppToggle = $('<div>').toggleFlip({ left_value: 'OFF', right_value: 'ON', flipped: that.app_data.top_level_domain=='1' }).addClass('tele-TopLevelDomainApp-toggle').appendTo('#tele-app-details');

		$('<div>').addClass('tele-title-1').html('Operation Mode').appendTo('#tele-app-details');

		var selected_opmod = '';
		switch(that.app_data.operation_mode) {
			case '1':	selected_opmod = 'training';   break;
			case '2':	selected_opmod = 'production';	   break;
			case '3':	selected_opmod = 'hybrid';	   break;
		}

		this.app_operation=$('<div>').appendTo('#tele-app-details').css({'width': '300px'});

		this.eta = $('<div>').html('ETA: ' + that.app_data.eta);

		this.opmod = $('<div>').teleRadios({
			checked: selected_opmod,
			radios: [
				{ key: 'training',   label: 'Training' },
				{ key: 'hybrid',   label: 'Hybrid' },
				{ key: 'production', label: 'Production'}

			],callback: function(radio){
				if(radio.key == 'training') {
					that.eta.show();
				} else {
					that.eta.hide();
				}
				if (state == 'new'&& radio.key != 'training'){
					telepath.dialog({title: 'alert', msg: 'New application need to be saved on training mode.'});
					that.opmod.teleRadios({checked: 'training'});
				}
			}}).addClass('tele-config-opmod').appendTo(this.app_operation);

		this.eta.appendTo(this.app_operation).css({float: 'left',clear: 'both','margin-top': '5px'});



		// MV2Prod after
		this.move_to_production = $('<div>').teleInput({
			label: 'Move to production per application after',
			suffix: 'requests',
			width: 70,
			value: that.app_data.move_to_production
		}).addClass('tele-config-mv2prod').appendTo('#tele-app-details');

		/*
		this.app_details = $('<div>').teleForm({
			title: 'Application Details',
			data:  this.app_data,
			items: [
				{ type: 'text', label: 'Application Domain', dataIndex: 'app_domain' },
				{ type: 'text', label: 'Display Name'	   , dataIndex: 'display_name' },
			]
		}).appendTo('#tele-app-details');
		*/
		
		// APP DETAILS -- Cookies
		
		var cookie_val = that.app_data.AppCookieName.split(',');
		
		this.app_cookies = $('<div>').teleMulti({ values: cookie_val, title: 'Application Cookies', template: function(element, value) {
			
			element.teleInput({ value: value });
			
			$('.tele-input-input', element).autocomplete({ 
				autoFill: true,
				source: that.app_data.cookie_suggestion,
				minLength: 0,
				appendTo:'#tele-app-details'
			}).focus(function () {
				$(this).autocomplete('search',"");
			}).data("ui-autocomplete")._resizeMenu = function() {
				this.menu.element.css({'max-height': 200, width: 170});
				this.menu.element.mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
			};
			$('.tele-input-input', element).data("ui-autocomplete")._renderItem = function (ul, item) {
				return $( "<li>" )
					.append( $( "<a>" ).text( item.label).attr('title', item.label) )
					.appendTo( ul );
			}
		} }).appendTo('#tele-app-details');

		// APP DETAILS -- IPS
		
		var ips_val = that.app_data.app_ips.split(',');
		/*
		this.app_ips     = $('<div>').teleMulti({ values: ips_val, title: 'Application IP Addresses', template: function(element, value) {
			element.ip({ data: value });
		} }).appendTo('#tele-app-details');
		*/
		// For now, we don't need multiple values. The + and - buttons are temporary hided in CSS
		this.app_ips     = $('<div id="tele-app-ip">').teleMulti({ values: ips_val, title: 'Application IP Addresses', template: function(element, value) {
			element.teleInput({value: value.split(':')[0], port: value.split(':')[1] ? value.split(':')[1] : ''});
			$('.tele-input-input', element).autocomplete({
				autoFill: true,
				source: that.app_data.ip_suggestion,
				minLength: 0,
				appendTo:'#tele-app-details'
			}).focus(function () {
				$(this).autocomplete('search',"");
			}).keydown(function(e) {

				var key = e.charCode || e.keyCode || 0;
				if (key >= 96 && key <= 105)
				{
					key = key - 48;
				}
				if(e.ctrlKey && key == 86)
					return;
				// Arrows, HOME, END, Numbers, Keypad Numbers
                                if(key == 8 || key == 9 || key == 46 || key == 190 ||
                                   (key >= 35 && key <= 40) ||
                                   (key >= 48 && key <= 57) ||
                                   (key >= 96 && key <= 105)) {

                                } else {
                                    // Stop Event
                                    return false;
                                }

			}).data("ui-autocomplete")._resizeMenu = function() {
				this.menu.element.css({'max-height': 100, width: 170});
				this.menu.element.mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
			};
		} }).appendTo('#tele-app-details') ;

		$("#tele-app-details").mCustomScrollbar({
			advanced: {
				updateOnContentResize: true
			},
		 scrollInertia: telepath.scrollSpeed
		});
		// AUTHENTICATION
		// AUTHENTICATION -- User Identification
		
		this.usernameParameter = $('<div>')
			.teleBrowse({ 
				label: 'Username Parameter', 
				value: that.app_data.form_param_name, 
				id: that.app_data.host,
				mode: 'param'
			})
			.appendTo('#tele-app-auth').hide()
			.css({ position: 'absolute', top: 100, left: 300 });


		var userID_val='';
		if(telepath.config.application.app_data.form_flag == '1') {
			userID_val = 'Form';
			this.usernameParameter.show();
		}
		/*else if(telepath.config.application.app_data.ntlm_mode == '1') {
			userID_val = 'NTLM';
		}*/
		else if(telepath.config.application.app_data.basic_mode == '1') {
			userID_val = 'Basic';
		}
		else if(telepath.config.application.app_data.digest_mode == '1') {
			userID_val = 'Digest';
		}
		else{
			userID_val = 'None';
		}

		this.SC_wrap = $('<div>');

		this.userIdentification = $('<div>').teleRadios({
			title: 'Authentication',
			checked: userID_val,
			radios: [
				//{ key: 'Automatic', label: 'Automatic' },
				{ key: 'Form', label: 'Form' },
				{ key: 'Basic', label: 'Basic' },
				{ key: 'Digest', label: 'Digest' },
				//{ key: 'NTLM', label: 'NTLM' },
				{ key: 'None', label: 'None' }
			], callback: function(radio) {

				that.usernameParameter.hide();
				that.SC_wrap.show();
				that.SC_wrap.show();
				switch(radio.key) {
					case 'Form':
						that.usernameParameter.show();
						break;
					case 'None':
						that.SC_wrap.hide();
						that.SC_wrap.hide();
						break
				}

			}}).css({ 'float': 'left', clear: 'both', width: 300, inputFirst: true }).appendTo('#tele-app-auth');
		// AUTHENTICATION -- Success Criteria

		
		this.SC_cookie_name   = $('<div>').teleInput({ label: 'Name', value: that.app_data.cookie_name });
		this.SC_cookie_value  = $('<div>').teleInput({ label: 'Value', value: that.app_data.cookie_value });
		this.SC_cookie_flag_val = that.app_data.cookie_value_appearance == '1' ? 'appears' : 'missing';
		this.SC_cookie_flag   = $('<div>').teleRadios({
			checked: this.SC_cookie_flag_val,
			radios: [ 
				{ key: 'missing', label: 'Value is missing' }, 
				{ key: 'appears', label: 'Value appears' }
			], callback: function(radio) {
			
				switch(radio.key) {

				}
				
		}});

		// SC_cookie
		// this.SC_cookie_toggle = $('<div>').teleCheckbox({ inputFirst: true, label: 'Cookie', checked: that.app_data.cookie_mode == '1' });
		this.SC_cookie_toggle = $('<div>').teleRadios({
			title: 'Cookie',
			checked: that.app_data.cookie_mode == '1' ? 'ON' : 'OFF',
			radios: [
				{ key: 'ON', label: 'ON' },
				{ key: 'OFF', label: 'OFF' }
			], callback: function(radio) {
				that.SC_cookie_name.hide();
				that.SC_cookie_value.hide();
				that.SC_cookie_flag.hide();
				switch(radio.key) {
					case 'ON':
						that.SC_cookie_name.show();
						that.SC_cookie_value.show();
						that.SC_cookie_flag.show();
						break;


				}

			}}).css({ clear: 'both', 'float': 'left' }).addClass('tele-radio-on-off').appendTo('#tele-app-auth');


		$('.tele-input-input', this.SC_cookie_name).autocomplete({ 
			autoFill: true,
			source: that.app_data.cookie_suggestion,
			minLength: 0,
			appendTo:'#tele-app-details'
		}).focus(function () {
			$(this).autocomplete('search', '');
		});
		
		this.SC_wrap.append('<div class="tele-form-hr">');

		this.SC_wrap.append('<div class="tele-title-1">Success Criteria</div>');

		this.SC_wrap.append(this.SC_cookie_toggle).append(this.SC_cookie_name).append(this.SC_cookie_value).append(this.SC_cookie_flag);

		this.SC_wrap.append('<div class="tele-form-hr">');
		
		// SC_redirect
				
		//this.SC_redirect_browse = $('<div>').teleBrowse({
		//	label: 'Page', value: that.app_data.redirect_page, id: that.app_data.host, type: 'page' });
		//this.SC_redirect_range  = $('<div>').teleInput({ label: 'Response status',
		//	value: that.app_data.redirect_status_code , type:'number' ,range:{min:200, max:600} });
        //
		////this.SC_redirect_toggle = $('<div>').teleCheckbox({ inputFirst: true, label: 'Redirect', checked: that.app_data.redirect_mode == '1' });
		//this.SC_redirect_toggle = $('<div>').teleRadios({
		//	title: 'Redirect',
		//	checked: that.app_data.redirect_mode == '1' ? 'ON' : 'OFF',
		//	radios: [
		//		{ key: 'ON', label: 'ON' },
		//		{ key: 'OFF', label: 'OFF' },
		//	], callback: function(radio) {
        //
		//		that.SC_redirect_browse.hide();
		//		that.SC_redirect_range.hide();
		//		 switch(radio.key) {
		//		 case 'ON':
		//			 that.SC_redirect_browse.show();
		//			 that.SC_redirect_range.show();
		//		 break;
		//		 }
        //
		//	}}).css({ clear: 'both', 'float': 'left' }).addClass('tele-radio-on-off').appendTo('#tele-app-auth');
        //
        //
		//SC_wrap.append(this.SC_redirect_toggle).append(this.SC_redirect_browse).append(this.SC_redirect_range);
		//
		//SC_wrap.append('<div class="tele-form-hr">');
		
		// SC_body
		

		
		this.SC_body_input  = $('<div>').teleInput({ label: 'Value to search in HTML body', value: that.app_data.body_value_html }).addClass('tele-app-auth-body');

		//SC_body_toggle = $('<div>').teleCheckbox({ inputFirst: true, label: 'Body Value', checked: that.app_data.body_value_mode == '1' });
		this.SC_body_toggle = $('<div>').teleRadios({
			title: 'Body Value',
			checked: that.app_data.body_value_mode == '1'? 'ON' : 'OFF',

			radios: [
				{ key: 'ON', label: 'ON' },
				{ key: 'OFF', label: 'OFF' },
			], callback: function(radio) {

				that.SC_body_input.hide();

				 switch(radio.key) {
				 case 'ON':
					 that.SC_body_input.show();
				 break;
				 }

			}}).css({ clear: 'both', 'float': 'left' }).addClass('tele-radio-on-off').appendTo('#tele-app-auth');

		this.SC_wrap.append(this.SC_body_toggle).append(this.SC_body_input);
		
	/*	var SC_toggle_val = that.app_data.form_authentication_flag == '1' ? 'ON' : 'OFF';
		
		//var SC_title = $('<div>').css({ marginTop: 55, marginBottom: 0 }).addClass('tele-title-1').html('Success Criteria').appendTo('#tele-app-auth');
		
		this.SC_toggle = $('<div>').teleRadios({
			title: 'Success Criteria',
			checked: SC_toggle_val,
			radios: [ 
				{ key: 'ON', label: 'ON' },
				{ key: 'OFF', label: 'OFF' },
			], callback: function(radio) {
				
				SC_wrap.hide();
				
				switch(radio.key) {
					case 'ON':
						SC_wrap.show();
					break;
				}
				
		}}).css({ clear: 'both', 'float': 'left' }).addClass('tele-radio-on-off').appendTo('#tele-app-auth');*/
		this.SC_wrap.appendTo('#tele-app-auth');

		$('#tele-app-auth').mCustomScrollbar({
			advanced: {
				updateOnContentResize: true
			},
			scrollInertia: telepath.scrollSpeed
		});

		// SSL
		var app_ssl_wrap   = $('<div>').addClass('tele-app-ssl-wrap');
		var app_ssl_toggle_val = that.app_data.ssl_flag == '1' ? 'ON' : 'OFF';
		this.app_ssl_toggle = $('<div>').teleRadios({
			title: 'SSL',
			checked: app_ssl_toggle_val,
			radios: [ 
				{ key: 'ON', label: 'ON' },
				{ key: 'OFF', label: 'OFF' },
			], callback: function(radio) {
				
				app_ssl_wrap.hide();
				
				switch(radio.key) {
					case 'ON':
						app_ssl_wrap.show();
					break;
				}
				
		}}).appendTo('#tele-app-ssl');
		
		var got_cert = that.app_data.ssl_data && that.app_data.ssl_data.subject;
		
		this.app_ssl_certificate = $('<div>').teleFile({ label: 'Certificate', value: got_cert ? 'Uploaded' : '' , type: 'certificate' }).appendTo(app_ssl_wrap);
		this.app_ssl_private     = $('<div>').teleFile({ label: 'Private Key', value: got_cert ? 'Uploaded' : '' , type: 'privatekey'  }).appendTo(app_ssl_wrap);
		this.app_ssl_port        = $('<div>').teleInput({ label: 'Server Port', value: that.app_data.ssl_server_port }).appendTo(app_ssl_wrap);
		// Make sure we don't have the password here from PHP

		this.app_ssl_password    = $('<div>').teleInput({ label: 'Certificate Password', value: '', pass: true }).appendTo(app_ssl_wrap);
		
		$('#tele-app-ssl').append('<div class="tele-form-hr">');
		app_ssl_wrap.appendTo('#tele-app-ssl');
		$(app_ssl_wrap).append('<div class="tele-form-hr">');

		if(that.app_data.ssl_data && that.app_data.ssl_data.subject) {
			$.each(that.app_data.ssl_data.subject, function(key,val) {
				$('<div style="clear:both;">').html(key + ' = ' + val).appendTo(app_ssl_wrap);
			});
		}
		if (that.nodeParent) {
			that.nodeParent.parent().find(".jstree-wholerow").css('background-color', '#FFFFFF');
			that.nodeParent.find('.jstree-wholerow').css("background-color", "rgba(189, 189, 189, 0.85)");

		}
		$('#tele-app-ssl').mCustomScrollbar({
			advanced: {
				updateOnContentResize: true
			},
			scrollInertia: telepath.scrollSpeed
		});
	},
	deleteApp: function(app_id, $nodeParent) {
		
		context_confirm('Delete Application', 'Are you sure you want to delete this application?', function () {

			telepath.ds.get('/applications/del_app', { app_id: [app_id] }, function(data) {
				if(data.success){
					$nodeParent.remove();
				}
				//telepath.config.applications.reload();
			}, 'Error deleting application');
			
		});
		
	},
	initToolBar: function() {
				
	}
}
