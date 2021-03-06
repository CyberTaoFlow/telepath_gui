telepath.config.rule = {

	delRule: function(rule_name, rule_category) {
		
		telepath.dialog({type:'dialog',
			msg:'This operation will delete the selected rule group. Are you sure?', 
			callback:function(){
				telepath.ds.get('/rules/del_rule', { name: rule_name, category: rule_category }, function(data) {

					telepath.config.rules.init();
				});
			}});		
	},
	editRule: function(id) {
	
		var that = this;
		
		this.container = $('<div>').addClass('tele-rule-editor');
		telepath.config.rules.contentRight.empty();
		telepath.config.rules.contentRight.append(this.container);

		// Containers
		this.toolbar   = telepath.config.rules.barRight;
		// Cleanup
		this.container.empty();
		//this.toolbar.empty();
		$('.tele-panel-subtitle-text').hide();

		//this.container.append('<h3 style="tele-title-1">Rule Editor</h3><br>');
		
		if(id == 'new') {
				
			this.data = { enable: true, name: '', desc: '', owner: '', score: 0, criteria: [], action_email_field: '', alert_param_ids: [], /*action_notifications: true, */action_syslog: false, action_injection: false, action_email: false, disable_db_save: false, /*action_email_owner: true,*/ category: telepath.config.rules.selectedCategory, new_rule: true };
			this.showRule();
			
		} else {
			
			// Load Application
			this.loadRule(id);
			
		}

	},
	loadRule: function (id) {
		
		var that = this;
		//this.rule_name = rule_name;
		//this.rule_category = rule_category;
		
		telepath.ds.get('/rules/get_rule', { id: id}, function(data) {
			that.data = data.items[0];
			that.data.id=id
			that.showRule();
		});
		
	},
	showRule: function() {
		
		var that = this;
		
		this.container.empty();
		// Rule Toggle
		// this.ruleToggle = $('<div>').toggleFlip({ left_value: 'OFF', right_value: 'ON', flipped: this.data['enable']}).css('color', 'black').appendTo(this.container);
		
		// Rule Name
		var ruleName = $('<div>').teleInput({ label: 'Name', value: this.data['name'] == 'new' ? '' : decodeEntities(this.data['name']) }).addClass('tele-rule-name');
		this.container.append(ruleName);
		
		// Rule Owner
		/*var ruleOwner = $('<div>').teleInput({ label: 'Owner', value: this.data['owner']  == '' ? '' : this.data['owner'] }).addClass('tele-rule-owner');
		this.container.append(ruleOwner);*/
		
		// Rule Desc
		var ruleDesc = $('<div>').teleInput({ label: 'Description', value: this.data['desc'] == '' ? '' : decodeEntities(this.data['desc']) }).addClass('tele-rule-desc');
		this.container.append(ruleDesc);
		
		var ruleScore = $('<div>').teleInput({ label: 'Score', width: 30, value: this.data['score'] == '' ? '95' :  this.data['score'] }).addClass('tele-rule-score');
		this.container.append(ruleScore);
	
		//this.data['builtin_rule'] = 0;	
		if (!this.data['builtin_rule'] || this.data['allow_edit'])
		{
			// UI Title
			var title1 = $('<div>').addClass('tele-title-1').text('Select type and build rule');
			this.container.append(title1);
		} else {
			var title1 = $('<div>').addClass('tele-title-1').text('Built in system rule');
			this.container.append(title1);
			$('input' ,ruleName).prop( "disabled", true );
			$('input' ,ruleDesc).prop( "disabled", true );
		}	
			// Condition list
		var cond = $('<div>').teleRule({ data: this.data });
		this.container.append(cond);
		
		var title2 = $('<div>').addClass('tele-title-1').text('Actions');
		this.container.append(title2);
		
		/*this.action_notifications = $('<div>').teleCheckbox({
			label: 'Notification', 
			checked: this.data.action_notifications
		}).appendTo(this.container);*/
		
		this.action_syslog = $('<div>').teleCheckbox({
			label: 'Syslog', 
			checked: this.data.action_syslog == '1'
		}).appendTo(this.container);
		
		/*this.headerInjection = $('<div>').teleCheckbox({
			label: 'Header Injection', 
			checked: this.data.action_injection
		}).appendTo(this.container);*/
		
		this.action_email = $('<div>').teleCheckbox({
			label: 'Email', 
			checked: this.data.action_email
		}).appendTo(this.container);
		
	/*	this.action_email_owner = $('<div>').teleCheckbox({
			label: 'Email rule owner', 
			checked: this.data.action_email_owner
		}).appendTo(this.container);*/
		
		
		// Captcha and Block CMD's
		
		var cmd_captcha_checked = false;
		var cmd_block_checked = false;

		if(this.data.cmd && this.data.cmd.length > 0) {
			$.each(this.data.cmd, function (i,x) {
				if (x == 'captcha') {
					cmd_captcha_checked = true;
				}
				if (x == 'block') {
					cmd_block_checked = true;
				}
			});
		}
		
		this.cmd_captcha = $('<div>').teleCheckbox({ 
			label: 'Captcha Challenge', 
			checked: cmd_captcha_checked
		}).appendTo(this.container);
		
		this.cmd_block = $('<div>').teleCheckbox({ 
			label: 'Block Access', 
			checked: cmd_block_checked
		}).appendTo(this.container);

		this.disable_db_save = $('<div>').teleCheckbox({
			label: 'Disable DB saving',
			checked: this.data.disable_db_save
		}).appendTo(this.container);

		if(!this.data.action_email_field) {
			this.data.action_email_field = '';
		}
		
		this.email_notifications = $('<div>').teleMulti({ validator: 'email', values: this.data.action_email_field.split(','), title: 'Email Notifications', template: function(element, value) {
			
			element.teleInput({ value: value });
			
		} }).addClass('tele-rule-email-notif').appendTo(this.container);
		
		//if(!this.data.alert_param_ids) {
		//	this.data.alert_param_ids = [ { mode: 'param' } ];
		//}
		//
		//this.alert_params = $('<div>').teleMulti({ validator: 'email', values: this.data.alert_param_ids, title: 'Parameters to show upon alert', template: function(element, value) {
		//
		//	element.teleBrowse({
		//		label: '',
		//		value: value.att_alias != '' ? value.att_alias : value.att_name,
		//		id: value.att_id,
		//		mode: 'param'
		//	});
		//
		//} }).addClass('tele-rule-alert-param').appendTo(this.container);
		//if (this.data['builtin_rule'])
		//{
		//	$(this.alert_params).hide();
		//}
		
		// IP , APP Filters
		var title1 = $('<div>').addClass('tele-title-1').text('IP exemption ').appendTo(this.container);
		if(!this.data.ip) { this.data.ip = '' }
		
		var is_range = this.data.ip.from != this.data.ip.to ;

		var ipWrap   = $('<div>').addClass('tele-ip-wrap');
		var ipStart  = $('<div>').addClass('tele-ip').ip({ data: this.data.ip.from });
		var ipDash   = $('<div>').addClass('tele-ip-dash').html('_');
		var ipEnd    = $('<div>').addClass('tele-ip').ip({data: is_range ? this.data.ip.to : '' });

		if(!is_range) {
			ipDash.hide();
			ipEnd.hide();
		}
	
		var ipToggle = $('<div>').toggleFlip({ 
		
			left_value: 'Single', 
			right_value: 'Range',
			flip: function () {
				ipEnd.toggle();
				ipDash.toggle();
			},
			flipped: is_range,
			
		});
	
		ipWrap.append(ipToggle).append(ipStart).append(ipDash).append(ipEnd).appendTo(this.container);
		
		
		var title1 = $('<div>').addClass('tele-title-1').text('Host name exemption ').appendTo(this.container);
			
		if(!this.data.domain) { this.data.domain = '' }	
		var app_filter_data = [ { text: decodeEntities(this.data.domain) } ];
		var filterApps = $('<div>').teleSelect({ type: 'subdomain', values: app_filter_data, appendTo: this.container, position:'bottom',click: function () { } })
			.appendTo(this.container).attr('id', 'limit-application');
		$('.tele-multi-control', filterApps).hide();
		
		this.cmd_wrap = $('<div>').addClass('tele-rule-cmd-wrap').appendTo(this.container);
		
		// Execute commands list
		this.command_exec_list = $('<div>').addClass('tele-rule-cmd-list').hide();
		if (this.data.exec && this.data.exec.length > 0) {
			this.command_exec_list.show();
		}

		$.each(telepath.rule_cmds, function (i, x) {

			var checked = false;
			var params = [];
			// Retrieve relevant data from DB
			if (that.data.exec && that.data.exec.length > 0) {
				$.each(that.data.exec, function (i, val) {
					if (x == val.command) {
						checked = true;
						params = val.params || [];
					}
				});
			}

			// We need an array with 6 items (empty or not) to create the boxes
			while (params.length < 6) {
				params.push('');
			}

			$('<div>').teleCheckbox({
				label: x,
				checked: checked,
				dropBoxes: params
			}).appendTo(that.command_exec_list);

		});

		// Clear the float
		that.command_exec_list.append($('<div>').addClass('clearfix'));

		// List od available params
		var drag = function (ev) {
			ev.originalEvent.dataTransfer.setData("text", ev.target.innerText);
		};

		var paramsList = $('<ul>');
		paramsList.append($('<li>').text('Hostname').attr('draggable', 'true').on('dragstart', drag));
		paramsList.append($('<li>').text('Source IP').attr('draggable', 'true').on('dragstart', drag));
		paramsList.append($('<li>').text('Destination IP').attr('draggable', 'true').on('dragstart', drag));
		paramsList.append($('<li>').text('Cookie').attr('draggable', 'true').on('dragstart', drag));
		paramsList.append($('<li>').text('Username').attr('draggable', 'true').on('dragstart', drag));
		paramsList.append($('<li>').text('URL').attr('draggable', 'true').on('dragstart', drag));

		that.command_exec_list.append($('<div>').addClass('tele-rule-drag-params').on({
			// When a parameter is dropped back to the list, we need to remove it from the boxes
			drop: function (ev) {
				ev.preventDefault();
				var data = ev.originalEvent.dataTransfer.getData("text");
				$('#' + data).remove();
			}, dragover: function (ev) {
				ev.preventDefault();
			}
		}).append(paramsList));
		
		this.command_exec_toggle = $('<div>').teleCheckbox({ 
			label: '<b>Execute commands</b>', 
			checked: this.data.exec && this.data.exec.length > 0,
			callback: function(val) {
				that.command_exec_list.toggle();
			}
		}).addClass('tele-rule-cmd-toggle').appendTo(this.cmd_wrap);
		
		this.command_exec_list.appendTo(this.cmd_wrap);
		
		this.container.mCustomScrollbar({ advanced:{ updateOnContentResize: true, autoScrollOnFocus: false },
			scrollInertia: telepath.scrollSpeed
		});

		telepath.config.rules.resizeLayout();

		this.container.mCustomScrollbar('update');

		// Apply / Cancel buttons
		
		var btnContain = $('<div>').addClass('tele-button-container');
		var saveBtn   = $('<a class="tele-button tele-button-apply">Save</a>');
		var cancelBtn  = $('<a class="tele-button tele-button-cancel">Cancel</a>');
		
		btnContain.append(saveBtn).append(cancelBtn);
		
		this.container.append(btnContain);
		
		// Callbacks
		saveBtn.click(function () {
			
			var ruleData = {
				name: $('.tele-rule-name input').val(),
				desc: $('.tele-rule-desc input').val(),
				//owner: $('.tele-rule-owner input').val(),
				//enable: that.ruleToggle.data('tele-toggleFlip').options.flipped,
				score: parseInt($('.tele-rule-score input').val()),
				category: that.data.category
			};
			
			// Validate name
			if(ruleData.name.length == 0) {
				telepath.dialog({ title: 'Rule Editor', msg: 'Must specify rule name' });
				return;
			}

			if(ruleData.name.length > 32) {
				telepath.dialog({ title: 'Rule Editor', msg: 'Rule name cannot contains more than 32 characters' });
				return;
			}
			
			// Validate score
			if(ruleData.score < 0 || ruleData.score > 100) {
				telepath.dialog({ title: 'Rule Editor', msg: 'Must specify score between 0 and 100' });
				return;
			}

			if (!telepath.config.rule.data.builtin_rule) {
				// Collect criteria
				ruleData.criteria = $('.tele-ruletype-select').data('teleTeleRule').getValues();


				//if the `getValues` above opened a dialog, stop now
				if ($('.tele-overlay-dialog').is(':visible')) {
					return;
				}

				// Validate criteria
				if (ruleData.criteria.length == 0) {
					telepath.dialog({title: 'Rule Editor', msg: 'Must have at least one condition'});
					return;
				}
			}
			else{
				ruleData.criteria = [];
				ruleData.criteria.push(JSON.stringify({'enable':$('.tele-rule-toggle .checked').size() > 0,'kind': telepath.config.rule.data.criteria[0].kind}));
			}

			/*if (that.action_notifications.data('teleTeleCheckbox').options.checked) {
				ruleData.action_notifications = true;
			}*/
			if (that.action_syslog.data('teleTeleCheckbox').options.checked) {
				ruleData.action_syslog = true;
			}
			if (that.action_email.data('teleTeleCheckbox').options.checked) {
				ruleData.action_email = true;
			}
			/*if (that.action_email_owner.data('teleTeleCheckbox').options.checked) {
				ruleData.action_email_owner = true;
			}*/


			var found = false;

			ruleData.action_email_field = $('.tele-rule-email-notif input').map(function(idx, elem) {
				if (!validateEmail($(elem).val()) && $(elem).val()!=''){
					$(elem).css({'border-color': "red"});
					telepath.dialog({ title: 'Rule Editor', msg: 'Please provide a valid email address' });
					found = true;
				}
				return $(elem).val();
			}).get().join();

			if (found){
				return
			}

			ruleData.ip= [];
			var ipInput = $('.tele-ip-segment');

			$('.tele-ip-segment.error').removeClass('error');
			var checkIPS = false;

			if ($('.tele-ip-wrap .tele-mini-toggle').data('tele-toggleFlip') && ipInput.map(function(){
					return $(this).val()}).get().join('') != '') {
				var is_range = $('.tele-ip-wrap .tele-mini-toggle').data('tele-toggleFlip').options.flipped;

				var ip_start = $('.tele-ip-wrap .tele-ip:first').data('tele-ip').getIP();
				var ip_end = $('.tele-ip-wrap .tele-ip:last').data('tele-ip').getIP();

				if (is_range) {
					if (ip_start && ip_end && ip2long(ip_start) < ip2long(ip_end)) {
						ruleData.ip = {from: ip_start, to: ip_end};
					}
					else{
						ipInput.addClass('error');
						checkIPS = true;
					}
				} else {
					if (ip_start) {
						ruleData.ip = {from: ip_start, to: ip_start};
					}
					else {
						ipInput.addClass('error');
						checkIPS = true;
					}
				}
			}
			if (checkIPS) {
				telepath.dialog({msg: 'You have entered an invalid IP address!'});
				that.container.mCustomScrollbar(
					"scrollTo", $('.tele-ip-segment.error').offset().top - 200, {scrollInertia: 0});

				return
			}

			ruleData.domain = $('#limit-application input').val();

			// Get rule commands executions
			ruleData.exec = [];
			// Toggle enabled
			if(that.command_exec_toggle.data('teleTeleCheckbox').options.checked) {
				// Iterate
				$('.tele-checkbox', that.command_exec_list).each(function () { 
					var opt = $(this).data('teleTeleCheckbox').options;
					if(opt.checked) {
						var params = [];
						var dropped = $(this).find('.tele-drop span');
						if (!$.isEmptyObject(dropped)) {
							$.each(dropped, function (i, val) {
								params.push(val.innerHTML);
							})
						}
						ruleData.exec.push({command: opt.label, params: params});
					}
				});
			}

			// Captcha and block commands
			ruleData.cmd = [];

			if(that.cmd_captcha.data('teleTeleCheckbox').options.checked) {
				ruleData.cmd.push('captcha');
			}
			if(that.cmd_block.data('teleTeleCheckbox').options.checked) {
				ruleData.cmd.push('block');
			}

			if(that.disable_db_save.data('teleTeleCheckbox').options.checked) {
				ruleData.disable_db_save=true;
			}

			// Spinning thingy..
			$('.tele-icon-rule-edit').append(telepath.loader).css({ backgroundColor: 'white' });

			// Drop to console.
			if(that.data.new_rule) {

				$.each(telepath.config.rules.categories,function(i,val){
					if(ruleData.name== val.name){
						telepath.dialog({ title: 'Case Editor', msg: 'Rule name already exists' });
						found=true
					}
				});

				if (found){
					return
				}
				// Create
				telepath.ds.get('/rules/add_rule', { ruleData: ruleData }, function(data) {
					that.data = data.items;
					that.showRule(); // Reload
					telepath.config.rules.init();
					telepath.dialog({msg:'Successfully created a rule'});
					
				},function(data){
					telepath.dialog({ title: 'Case Editor', msg: data.error });
				});
			
			} else {

				ruleData.id = that.data.id;

				var found=false;
				$.each(telepath.config.rules.categories,function(i,val){
					if( val.id!="Login Brute-Force" && val.id!="Credential-Stuffing" && val.id!="Web shell" && ruleData.name== val.name && ruleData.id != val.id){
						telepath.dialog({ title: 'Case Editor', msg: 'Rule name already exists' });
						found=true
					}
				});

				if (found){
					return
				}
				// Update
				telepath.ds.get('/rules/set_rule', { ruleData: ruleData, builtin_rule: that.data.builtin_rule }, function(data) {
					that.data = data.items;

					//that.showRule(); // Reload

					if(data.success){
						$('.jstree-clicked').text(ruleData.name);
						telepath.dialog({msg:'Successfully updated a rule'});
						telepath.config.rule.editRule(ruleData.id);
						telepath.config.rules.init();
					}
				}, function (data) {
					telepath.dialog({title: 'Case Editor', msg: data.error});
				});
			
			}

		});
		
		
		// Reload the rule from data previously stored
		cancelBtn.click(function () {
			that.showRule();
		});
		/*
		
		// Rule Enabled
		this.description = $('<div>').teleCheckbox({ 
			label: 'Enabled', 
			checked: this.rule_data['enable_rule']
		}).appendTo(this.container);
	
		// Rule Name
		this.name = $('<div>').teleInput({ 
			label: 'Rule Name', 
			value: this.rule_data['name'] 
		}).appendTo(this.container);
		
		// Rule Description
		this.description = $('<div>').teleInput({ 
			label: 'Rule Description', 
			value: this.rule_data['description'] 
		}).appendTo(this.container);
		
		//this.debug();
		*/
		
	},
	debug: function () {
		for(key in this.rule_data) {
			var value = this.rule_data[key];
			$('<div>').css({ 'clear': 'both', 'float': 'left', 'width': '400' }).html(key + ' : ' + value).appendTo(this.container);
		}
	}
}
