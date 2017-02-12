telepath.action = {};

telepath.action.recorder = {
	
	new_flow: true,
	requests: [],
	paused: false,
	ts_offset: 0,
	// set this variable when the user click on an application in the left panel to check if the record is on
	timer: false,
	id: false,
	initRecordingTools: function(action_name) {
		
		var that = this;
		this.recordTools = $('<div>').addClass('tele-record-tools');
		
		if(!action_name) {
			action_name = '';
		}
		
		// Name
		this.actionName = $('<div>').teleInput({
			value: action_name,
			label: 'Name:',
			labelCSS: {width: 48, 'margin-left': 23},
			width: 220
		});
		this.recordTools.append(this.actionName);
		
		// Controls
		var controls = ['stop', 'pause'];
		$.each(controls, function (i, control) {
			var controlEl = $('<div>').addClass('tele-control').addClass('tele-control-' + control).html('<div></div>').click(function () {

				switch (control) {

					case 'stop':

						clearInterval(that.timer);
						telepath.action.recorder.init();

						break;

					case 'pause':
						$(this).toggleClass('tele-control-pause');
						$(this).toggleClass('tele-control-record');
						that.paused = !that.paused;

						break;

				}

			});

			that.recordTools.append(controlEl);
		});

		this.container.parent().prepend(this.recordTools);
		
	},
	processRequests: function (requests) {

		var that = this;

		if (requests.length > 0) {
			$.each(requests, function (i, request) {

				// If paused, don't add the request, but we want to continue getting requests to pop them from the
				// Redis queue
				if (!that.paused) {
					request.el = $('<div>').teleRequest({data: request});
					$('.mCSB_container', that.container).append(request.el);
					that.requests.push(request);
				}

			});
		}

	},
	startRecording: function(type) {
		
		var that = this;
		this.timer = true;
		this.timerValue = 0;
		this.recordType = type;
		clearInterval(this.timer);
		that.progbarInner.css({ width: 0 });

		switch (type) {
			case 'u':
				var value = $('a', this.input).attr('href').split('=')[1]; // ssl://sub.domain?hybridrecord = VALUE
				break;
			case 's':
				// in user mode we need to send the 'sha256_sid' field associated with the username
				var value = $('input', this.input).data('sha256_sid');
				break;
			case 'i':
				var value = $('input', this.input).val();
				break;
		}

		$('input', this.input).css({ borderColor: '#999' });

		if (!value) {
			$('input', this.input).css({borderColor: 'red'});
			telepath.dialog({type: 'alert', title: 'Business Action', msg: 'Missing value'});
			return false;
		}
		
		this.recordValue = value;


		function tick(id) {

			that.timerValue += 5;
			that.progbarInner.css({width: that.timerValue + '%'});

			telepath.ds.get('/actions/get_requests', {
				id: id
			}, function (data) {
				if (data.total > 0) {
					// If it's the first time we have requests matching recording parameters, we need to initialize
					// recording.
					if (!that.dataLoaded) {
						that.dataLoaded = true;

						// Clearup
						that.container.empty();

						// Another inner container for padding
						var tmp = $('<div>').addClass('tele-action-container');
						that.container.append(tmp);
						that.container = tmp;

						that.initRecordingTools();

						$('.tele-action-container').css({padding: 0, height: $(that.container).parent().height() - 150})
							.mCustomScrollbar({
							scrollButtons: {enable: false},
							scrollInertia: 150,
							advanced: {
								updateOnContentResize: true
							}
						});

						that.showSaveLoad = telepath.config.action.showSaveLoad;
						that.showSaveLoad(true);

						// if URL mode is enabled, we don't display the first recorded request with the hybridrecord GET
						// parameter
						if (type != 'u'){
							that.processRequests(data.items);
						}

					}
					else {
						// display recorded requests
						that.processRequests(data.items);
					}




				}
			});
				
			
			if(that.timerValue > 99 && !that.dataLoaded) {
				clearInterval(that.timer);
				that.timer=false;
				if(!$('.tele-overlay-dialog').is(':visible')){
					telepath.dialog({ type: 'alert', title: 'Business Action', msg: 'No matching requests, tracking timed out.' });
				}
				that.progbarInner.css({width: 0});
				$('.tele-control-record-cmd-lbl').html('Start Recording');
				var record_ico = $('.tele-control .tele-control-stop');
				record_ico.toggleClass('tele-control-stop');
				record_ico.toggleClass('tele-control-record');
				that.endRecord();
			}
		
		}


		telepath.ds.get('/actions/start_recording', {
			mode: that.recordType,
			value: that.recordValue,
			host: telepath.action.currentApp
		}, function (data) {
			if (data.total > 0) {
				that.id = data.items.id;
				that.dataLoaded = false;
				tick(that.id);
				that.timer = setInterval(function () {
					tick(that.id);
				}, 3000);
			}
		});

		return true;
	},
	endRecord: function () {
		var that = this;
		if (that.id) {
			telepath.ds.get('/actions/end_record', {id: that.id}, function (data) {
				that.id = false;
			});
		}
	},
	init: function () {
		
		$('.popover').remove();

		if (this.timer){
			this.endRecord();
			this.timer=false;
		}

		
		// Trackers
		this.trackers = [
			{ type: 'u', title: 'URL', desc: 'Record all activity from URL' },
			// send 'sha256_sid' field of the user
			{ type: 's', title: 'Username', desc: 'Record all activity of a speciﬁc user' },
			{ type: 'i', title: 'IP', desc: 'Record all activity of a speciﬁc device' },
		];
		
		// Containers
		this.container = telepath.config.actions.contentRight;
		this.toolbar   = telepath.config.actions.barRight;
		this.container.addClass('tele-workflow-recorder');
		
		// Cleanup
		this.container.empty();
		this.toolbar.empty();
		
		// Title 
		this.barTitle  = $('<div>').addClass('tele-panel-subtitle-text').html('Record New Business Action');
		this.toolbar.append(this.barTitle);
		
		// Trackers Title
		this.trackersTitle  = $('<div>').addClass('tele-title-1').html('Select recording source:');
		this.container.append(this.trackersTitle);
		
		//this.initDebugger();
		//return;
		
		// Printout
		this.printTrackers();
		this.container.mCustomScrollbar({ advanced:{ updateOnContentResize: true } });

	},
	initDebugger: function () {
		// console.log('Actions debugger online');
		// console.log('Current host  : ' + telepath.action.currentApp);
		this.container.append('<div>Active sessions in last 5 minutes ::</div>');
		var that = this;
		telepath.ds.get('/actions/get_top_active_sessions', { host: telepath.action.currentApp.trim() }, function(data) {
			// console.log(data.items);
			if(data.items) {
				$.each(data.items, function(i, item) { 
					// console.log(item);
					var item_el = $('<div>');
					item_el.append('<span>' + new Date(item.ts * 1000).toString() + '<span>');
					item_el.append('<span>' + item.sid + '</span>');
					
					item_el.click(function () {
						
						$(this).css({ paddingBottom: 20 });
						// console.log('Tracking ' + item.sid + ' starting stamp ' + item.ts);
						
						
						if(telepath.action.recorder.timer) {
							clearInterval(telepath.action.recorder.timer);
						}
						
						telepath.action.recorder.timer = setInterval(function () {
							telepath.ds.get('/actions/track_session_by_sid', { sid: item.sid, time: item.ts }, function(data) {
								// console.log(data);
								if(data.items && data.items.length > 0) {
									item_el.append($('<div>').html(JSON.stringify(data)));
								}
								// Process even if no items to reset timer iteration
								// that.processRequests(data.items);
							});
						}, 3000);

					});
					
					that.container.append(item_el);
					
				});
			}
		});
		
	},
	trackerClick: function(el, type) {
		
		var that = this;
		
		var trackerInfo = $('<div>').addClass('tele-workflow-tracker-info').addClass('tele-rounded-box').hide();
	
		//var trackerTitle = $('<div>').addClass('tele-title-2').html('Its recommended that you clear browser cache before you start recording');
		//trackerInfo.append(trackerTitle);
		
		var application_ssl       = false;
		var application_subdomain = '';
		var application_domain    = telepath.action.currentApp;
		var hybrid_record         = 'hybridrecord';
		var hybrid_record_id      = Math.floor(Math.random() * (999999 - 100000 + 1)) + 99999; // 99-999K random seed
		
		// Build link
		var hybrid_link           = (application_ssl ? 'https://' : 'http://') +  // SSL
									(application_subdomain != '' ? application_subdomain + '.' : '') + // Subdomain
									application_domain + '/?' + hybrid_record + '=' + hybrid_record_id; // Domain + Link
		
		switch(type) {
				
				case 'i':
					var input = $('<div>').teleInput({ label: 'Target IP:' });
					trackerInfo.append(input);
				break;
				case 's':
					var input = $('<div>').teleInput({ label: 'Target Username:' });
					trackerInfo.append(input);
				break;
			//URL
				case 'u':
					var input = $('<div>').teleInput({ label: 'Target URL:', value: hybrid_link, link: true });
					$('a', input).attr('title', hybrid_link);
					trackerInfo.append(input);
				break;
			
		}
		
		input.addClass('tele-workflow-tracker-input-' + type);
		
		if(type !== 'u') {
		
			$('.tele-input-input', input).autocomplete({ 
				autoFocus: true,
				source: function(request, response) {
					telepath.ds.get('/actions/get_suggest', { mode: type, host: application_domain }, function(data) {
						if(data.total > 0) {
							response(data.items);
						}
						else{
							if(type == 's' && !$('.tele-overlay-dialog').is(':visible')){
								telepath.dialog({
									type: 'alert',
									title: 'Business Actions',
									msg: 'You need to login before you start recording'
								});
							}
						}
					});
				},
				minLength: 0,
				change: function(event,ui) {
					if (ui.item == null && type == 's') {
						$(this).val('');
						$(this).focus();
					}
				},
				select: function(event,ui) {
					// in user mode we need to send the 'sha256_sid' field associated with the username
					if (type == 's'){
						$(this).data('sha256_sid', ui.item.sha256_sid);
					}
				}
			}).focus(function () {
				$(this).autocomplete('search', $(this).val());
			});
		
		}
		
		/*
		var controls = [ 'record', 'stop', 'pause' ];
		$.each(controls, function(i, control) {
			var controlEl = $('<div>').addClass('tele-control').addClass('tele-control-' + control).html('<div></i');
			trackerInfo.append(controlEl);
		});
		*/
		
		// Record Button

		that.input = input;
		var record_cmd = $('<div>').addClass('tele-control-record-cmd').hover(function () {
			$('*', this).addClass('hover');
		}, function () {
			$('*', this).removeClass('hover');
		}).click(function () {
			if (record_lbl.html() == 'Start Recording' && that.startRecording(type)) {
				record_lbl.html('Stop Recording');
				record_ico.toggleClass('tele-control-record');
				record_ico.toggleClass('tele-control-stop');
			} else {
				clearInterval(that.timer);
				that.progbarInner.css({width: 0});
				that.timer = false;
				record_lbl.html('Start Recording');
				record_ico.toggleClass('tele-control-stop');
				record_ico.toggleClass('tele-control-record');
				that.endRecord();
			}
		});
		
		var record_lbl = $('<div>').addClass('tele-control-record-cmd-lbl').html('Start Recording');
		var record_ico = $('<div>').addClass('tele-control').addClass('tele-control-record');
		var record_div = $('<div>');
		
		// Button
		record_ico.append(record_div);
		record_cmd.append(record_ico).append(record_lbl);

		// Progbar
		var progbar 	  = $('<div>');
		progbar.addClass('tele-listitem-bigprogbar');
		this.progbarInner = $('<div>').addClass('tele-listitem-progbar-inner').css({ width: 0 });
		progbar.append(this.progbarInner);
		
		// Append		
		trackerInfo.append(record_cmd);
		trackerInfo.append(progbar);
		
		// Fade In
		$(el).animate({ marginBottom: 100 }, 'fast', function () {
			$(this).append(trackerInfo);
			trackerInfo.fadeIn();
		});
		
	},
	printTrackers: function() {
		
		var that = this;
		var container = this.container;
		
		$.each(this.trackers, function (i, tracker) {
			
			//console.log(tracker);
			
			var trackerEl = $('<div>').addClass('tele-workflow-tracker').addClass('tele-rounded-box');
			var trackerTitle = $('<div>').addClass('tele-title-1').html(tracker.title);
			var trackerDesc  = $('<div>').addClass('tele-text').html(tracker.desc);
			
			trackerEl.append(trackerTitle).append(trackerDesc);
			
			trackerEl.hover(function () {
				$(this).addClass('hover');
			}, function () {
				$(this).removeClass('hover');
			}).click(function () {
				
				// Already active
				if($(this).hasClass('selected')) {
					return;
				}
				
				// Cleanup
				$('.tele-workflow-tracker.tele-rounded-box.selected').each(function () {
					$(this).animate({ marginBottom: 10 }, 'fast', function () {
					}).removeClass('selected');
					$('.tele-workflow-tracker-info', this).fadeOut('fast', function () { $(this).remove(); });
				});
				
				// Activate
				$(this).addClass('selected');
				that.trackerClick(this, tracker.type);
				
			});
			
			container.append(trackerEl);
		
		});
	
	},
	
};

telepath.config.action = {
	new_flow: false,
	editAction: function(action_data) {
	
		// Containers
		this.container = telepath.config.actions.contentRight;
		this.toolbar   = telepath.config.actions.barRight;
		
		// Cleanup
		this.container.empty();
		this.toolbar.empty();
		
		// Tab Containers
		this.tabsEl   = $('<div>').addClass('tabs');
		this.tabsUl   = $('<ul>');
		this.tabsEl.append(this.tabsUl);
		
		telepath.action.currentApp = action_data.application;
		
		this.action_data = action_data;
		this.showAction();
		
	},
	showAction: function(action_name) {
		
		// Clearup
		var that = this;
		that.container.empty();
		$('.popover').remove();
		
		if(!action_name) {
			action_name = '';
		}

		// Name
		// this.recordTools = $('<div>').addClass('tele-record-tools');
		// this.actionName = $('<div>').teleInput({ value: action_name, label: 'Name' });
		// this.recordTools.append(this.actionName);
		// this.container.append(this.recordTools);
				
		
		if(that.action_data) {
			
			// Another inner container for padding
			var tmp = $('<div>').addClass('tele-action-container').css({
				padding: 0,
				height: $(that.container).parent().height() - 210
			});
			that.container.append(tmp);
			$(tmp).mCustomScrollbar({
				advanced: {
					updateOnContentResize: true,
					scrollInertia: telepath.scrollSpeed
				}});
			that.container = tmp;
		
			$.each(that.action_data.business, function(i, request) {
				
				request.el = $('<div>').teleRequest({ data: request });
				$('.mCSB_container', that.container).append(request.el);

			});
			
			that.showSaveLoad();
			
		}
				
	},
	showSaveLoad: function(name_validate) {
		
		var that = this;
		
		this.buttonsEl = $('<div>').addClass('tele-form-buttons');
		this.applyBtn  = $('<a class="tele-button tele-button-apply">Save</a>');
		this.cancelBtn = $('<a class="tele-button tele-button-cancel">Cancel</a>');
		
		this.buttonsEl.append(this.applyBtn).append(this.cancelBtn);
		this.container.append(this.buttonsEl);
		
		// BIND Validate
		this.applyBtn.click(function () { 
			
			// Validate name
			// Iterate request widgets
			
			var actionData = [];
			$('.tele-action-container .tele-request').each(function () { 
				actionData.push($(this).data('tele-tele-request').options.data);
			});
			
			// Take just what we need
			
			var cleanData = [];
			
			// console.log(actionData);
			
			$.each(actionData, function(i, action) {
				
				var jsonNode = { pagename : action.uri ? action.uri : action.pagename };

				if(action.parameters && action.parameters.length > 0) {
					jsonNode.params = [];
					$.each(action.parameters, function (i, param) {
						jsonNode.params.push( { name: param.name, data: param.data } );
					});
				}
				
				cleanData.push(jsonNode);
			
			});
			
			// console.log(cleanData);
			
			// Either stored or from input
			var flow_name = that.action_data && that.action_data.action_name ?  that.action_data.action_name : $('input', telepath.action.recorder.actionName).val();
			
			if(!flow_name || flow_name == '') {
				telepath.dialog({ type: 'alert', title: 'Business Actions', msg: 'Missing action name' });
				return;
			}

			if (name_validate){
				// Check if name already exists
				telepath.ds.get('/actions/check_existing_action_name', {
					host: telepath.action.currentApp,
					name: flow_name
				}, function (data) {
					if (data.items) {
						telepath.dialog({
							type: 'dialog',
							title: 'Business Actions',
							msg: 'This action name already exists. Do you want to override it?',
							callback: function () {
								telepath.config.action.postToServer(flow_name, cleanData);
							}
						});
					}
					else {
						telepath.config.action.postToServer(flow_name, cleanData);
					}
				});
			}
			else {
				telepath.config.action.postToServer(flow_name, cleanData);
			}


		});
		
		// BIND Cancel -- Clear all, show recorder
		this.cancelBtn.click(function () {
			// Clear timer when cancel is clicked
			clearInterval(telepath.action.recorder.timer);
			telepath.action.recorder.init();
		});
	
	},
	postToServer: function (flow_name, cleanData) {
		// Post to server
		telepath.ds.get('/actions/set_flow', {
			app: telepath.action.currentApp,
			flow_name: flow_name,
			json: JSON.stringify(cleanData)
		}, function (data) {
			clearInterval(telepath.action.recorder.timer);
			// Notify user
			telepath.dialog({
				type: 'alert',
				title: 'Business Actions',
				msg: 'The Business Action was successfully recorded'
			});
			telepath.config.actions.reload();
			telepath.action.recorder.init();
		});
	}

};

/* DEPR */

function RecordFlow(container) {
	
	this.itemWidth = 330;
	this.container = container;

}

RecordFlow.prototype.clear  = function () {
	
	$('.flowContainer', this.container).remove();
	
}

RecordFlow.prototype.refresh = function (data) {
	
	// Clear outer
	$('.flowContainer', this.container).remove();
	
	// Clear inner
	this.flowContainer = $('<div>').addClass('flowContainer');
	this.container.append(this.flowContainer);
	
	var totalPrinted = 0;
	var totalLimit   = data.length;
	
	for(var i=0; i < totalLimit; i++) { 
		var requestTable = this.getRequestTable(data[i]);
		this.flowContainer.append(requestTable);
		totalPrinted++;
	}
	
	$(this.flowContainer).append('<div class="clear"></div>');

}

RecordFlow.prototype.getRequestTable = function(request) {
	
	var table = $('<table>').addClass('record-flow-table');

	function getCell(html, className) {
		var result = $('<td>').html(html);
		if(className) {
			result.addClass(className);
		}
		return result;
	}
	
	var row = $('<tr>');

	if(request.date) {
		
		var date = new Date(request.date*1000);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		
		row.clone().append(getCell('Time'))
						.append(getCell(hours + ':' + minutes + ':' + seconds))
						.appendTo(table);
	
	}
	
	// PARAMETERS
	if(request.params && request.params.length > 0) {
		
		for (var i=0; i < request.params.length;i++) {
			
			var z = request.params[i];
			var cell = $('<td>');
			
			// Our magic attribute
			if(z['att_id'] == '18' || z['att_name'] == 'hybridrecord') {
				continue;
			}
			
			var link = $('<a>').text(decodeURIComponent(z['att_name'])).attr('rel', z['att_id']);
			
			var valueCell = $('<td>');
			var valueEdit = $('<span>').addClass('icon-edit').attr('rel', z['att_id']);
			var valueLink = $('<span>').text(z['data']).attr('rel', z['att_id']);
			
			if(!z.include) {
				valueLink.addClass('excluded');
			}
			
			link.click(function () {
				
				var id = $(this).attr('rel');
				$.each(pageNode.childNodes, function(i, record) {
					var recordID = record.data.id.split('_')[2];
					if(id == recordID) {
						pageNode.expand();
						telepath.workflow.apptree.getSelectionModel().select(record);
					}
				});
				
			});
			
			valueEdit.click(function () {
				
				var id = parseInt($(this).attr('rel'));
				
				$(this).parent().find('span').hide();
				
				var valueInput = $('<input>').val($(this).parent().find('span:last').text()).attr('rel', id);
				valueInput.blur(function () {
					
					var id    = parseInt($(this).attr('rel'));
					var value = $(this).val();
					if(value == '') value = '*';
					
					$(this).parent().find('span').show();
					$(this).parent().find('span:last').text(value).removeClass('excluded');
					$(this).remove();
					
					$.each(request.params, function (i, param) {
						if(param.att_id == id) {
							param.data = value;
							param.include = true;
						}
					});
					
				});
				
				$(this).parent().append(valueInput);
				valueInput.focus();
				
			}).hover(function () { $(this).addClass('hover'); }, function () { $(this).removeClass('hover') });
			
			cell.append(link);
			valueCell.append(valueEdit).append(valueLink);
			
			row.clone().append(cell)
				   .append(valueCell)
				   .appendTo(table);
				   
		}
	
	}
	

	// Look, a Zebra!
	$('tr:even', table).addClass('even');
	$('tr:odd', table).addClass('odd');
	
	var app = '';//recordNode.parentNode.raw.app_domain;
	var ssl = '';//recordNode.parentNode.raw.ssl_flag;
	
	var url = (ssl==1?"https":"http")+"://"+ app + request.path;
	var link = $('<a>').addClass('icon-link').text('').attr('href', url).attr('target', '_blank').hover(function () { $(this).addClass('hover'); }, function () { $(this).removeClass('hover') });
	var span = $('<span>').text(request.page_name != "" ? request.page_name : request.path).hover(function () { $(this).addClass('hover'); }, function () { $(this).removeClass('hover') }).css('text-decoration', 'underline');
	
	span.click(function () {
		pageNode.expand();
		telepath.workflow.apptree.getSelectionModel().select(pageNode);
	});
	
	var wrap       = $('<div>').addClass('record-flow-wrap');
	var inner_wrap = $('<div>').addClass('record-flow-inner-wrap');
	var table_wrap = $('<div>').addClass('record-flow-table-wrap');
	var title_wrap = $('<div>').addClass('record-flow-title-wrap');
	
	title_wrap.append(span).append(link);
	table_wrap.append(table);
	inner_wrap.append(title_wrap).append(table_wrap);
	wrap.append(inner_wrap);

	return wrap;

}
