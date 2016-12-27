telepath.sessionflow = {
	
	RID: 0,
	RIDS: [],
	list: false,
	searchkey: '',
	selectedIndex: 0,
	selectedBox:'',
	similarities: [],
	currentUID: -1,
	reloadFlag: Date.now(),
	alertsList: false,
	session: { requests: [], alerts: [], flows: [] },

	printRequestScores: function(data, container) {
		
		this.requestScoreEl = $('<div>').anomalyScore({ request: data });
		
		container.append(this.requestScoreEl);
		
	},
	showSimilarities: function(data) {
		
		var that = this;
		
		this.similarities = data;
		//$('<div>').addClass('tele-title-1').html('Similar Requests').css({ cssFloat: 'none' }).appendTo(this.boxRight);
		//this.similaritiesList = $('<div>').appendTo(this.boxRight).addClass('tele-similarities-list');
		
		var height = this.overlay.contentEl.height() - this.requestScoreEl.outerHeight() - $('.tele-alert-info-table', this.overlay.contentEl).outerHeight() - 2*20 - 75;
		//console.log(height);

		if (this.width <= 1250) {

			this.similaritiesList = $('<div>').appendTo($('.mCSB_container',this.boxRight)[0]).addClass('tele-similarities-list');
			height = 'auto'
			//var height = this.overlay.contentEl.height() - this.requestScoreEl.outerHeight() - $('.tele-alert-info-table', this.overlay.contentEl).outerHeight()- 2*20 - 75 -75;
			//this.similaritiesList.css({ 'height': height });
		}
		else{
			this.similaritiesList = $('<div>').appendTo(this.boxRight).addClass('tele-similarities-list');
			this.similaritiesList.css({ width: 380, 'height': height /* + " !important" */ }); // Weird :)
		}

		//$(this.boxRight).mCustomScrollbar('update');

		this.similaritiesList.on('teleList.afterUpdate', function (){

			$(this).trigger('resize');
		});

		this.similaritiesList.teleList({
			data: data.hits.hits,
			title: 'Similar Requests', 
			height: height,
			formatter: function(row) {
				return telepath.sessionflow.formatData(row);
			},
			callbacks: {
				click: function (widget) {
					that.expandSimilar(widget.options.raw, widget.element)
				},
				hover_in: function(el, item) { 
				
					// Cleanup
					$('.popover').remove();
					var that = this;
				
					// Init
					var RID = item.dataID;
					var similarity = telepath.sessionflow.lookupSimilarity(RID);
					
					// Check
					if(similarity === false) { return; }
	
					function getRow(lbl, data) {
						var row = $('<tr>');
						var td_1 = $('<td>').html(lbl).addClass('tele-alert-info-key');
						var td_2 = $('<td>').html(data).addClass('tele-alert-info-value');
						row.append(td_1).append(td_2);
						return row;
					}
					
					// console.log(similarity);
					
					similarity._source._score = similarity._score;
					similarity = similarity._source;
					
					// console.log(similarity);
					
					// Fill table data
					var table =  $('<table>').addClass('tele-alert-info-table');
					
					table.append(getRow('Time:', date_format('d/m/y | H:i:s', similarity.ts)));
					//table.append(getRow('Severity:', this.getSeverity(alert.numeric_score)));
					table.append(getRow('Application:', similarity.host));
					table.append(getRow('IP:', similarity.ip_orig));
					table.append(getRow('Location:', (similarity.country_code!='00'?'<span class="flag flag-' + similarity.country_code + '"></span>':'') +
										'<span class="tele-country">' + telepath.countries.a2n(similarity.country_code) + '</span>'));
					if(similarity.username){
						table.append(getRow('User:', similarity.username));
					}
					
					table.append(getRow('Similarity:',parseInt(similarity._score).toFixed(2)+ '%'));
					
					//if(alert.user && alert.user != '') {
					//	table.append(getRow('User:', alert.user));
					//}

					telepath.sessionflow.pop = $('<div>').css({
						position: 'absolute', 
						top: $(el).offset().top,
						left: $(el).offset().left - 10
					});
				
					$('body').append(telepath.sessionflow.pop);
					$(telepath.sessionflow.pop).popover({
					//selector: '[rel=popover]',
					placement: 'left',
					title: similarity.orig_ip,
					html: true,
					content: '<table cellspacing="10">' + table.html() + '</table>',
					//template: '<div class="popover arrow-similar" role="tooltip"><div class="popover-arrow"></div>' +
					//'<h3 class="popover-title"></h3><div class="popover-content"></div></div>',
					}).popover('show');
									
										
				},
				hover_out: function(el, item) {	
					
					if(telepath.sessionflow.pop) {
						telepath.sessionflow.pop.remove();
					}
					
				}
		}});
		this._resize();
		
		this.similaritiesList.css("height", "300px !important"); // Weird :)
		this.similaritiesList.trigger('resize');
                 //Bind resize hooks

                $(window).resize(function () { that._resize() });
	
	},
	_resize: function() {

		this.width = window.innerWidth;

		var height = $(window).height() - 100;
		var width = $(window).width() - 100;
		$('.tele-overlay').css({
			height: height,
			width: width,
			marginLeft: -1 * parseInt(width / 2),
			marginTop: -1 * parseInt(height / 2)
		});
		$('.tele-overlay-content').css({height: height -40});

		if (this.width <= 1250 ) {
			if (this.boxMid.children().length) {
				this.boxMid.width(0);
				$('.tele-request-details').detach().insertAfter($('.tele-overlay-header-right'));
				$('.tele-similarities-list .tele-list').height('auto').mCustomScrollbar("update");
				this.similaritiesList.attr('style', '');
				this.boxRight.mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
			}
			$('.tele-request-details').attr('style', '').mCustomScrollbar("destroy");
			var actionHeight = this.container.height() - $('.tele-alert-stats').height() - 70;
			var mid_width = width - $(this.boxLeft).outerWidth() - 55;
			this.boxRight.css({'height': height - 100}).width(mid_width);
			this.boxRight.mCustomScrollbar('update');

		}
		else {
			var items = $('.tele-request-details', this.boxMid).size();

			if (items == 2) {
				height = (height / 2) - 80;
				$('.tele-request-details').css({height: height}).mCustomScrollbar('update');
			}

			if (!$('.tele-request-details', this.boxMid).length) {
				$('.tele-request-details').detach().appendTo(this.boxMid).mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
				this.boxRight.attr('style', '');
				this.similaritiesList.css({'height': 'auto'});
			}
			$('.tele-box-right').mCustomScrollbar("destroy");
			var actionHeight = this.container.height() - $('.tele-alert-stats').height() - 100;
			this.container.append(this.boxLeft, this.boxMid, this.boxRight);
			var mid_width = width - $(this.boxLeft).outerWidth() - $(this.boxRight).outerWidth() - 60;
			this.boxMid.width(mid_width);
			this.requestDetails.mCustomScrollbar('update');

			height = this.overlay.contentEl.height() - this.requestScoreEl.outerHeight() -
				$('.tele-alert-info-table', this.overlay.contentEl).outerHeight() - 115;
			$('.tele-similarities-list .tele-list').height(height).mCustomScrollbar("update");
		}

		$(this.actionsContainer).css({'height': actionHeight});

	},
	init: function(SID, /*IP, alerts_names,*/ state,  searchkey, list) {

		this.session = false;
		this.SID  = SID;
		//this.IP  = IP;
		//this.alerts_names = alerts_names;
		this.searchkey = searchkey;
		this.list = list;
		this.state= '';
		this.range= true;

		if (searchkey && state =='suspect')
		{
			this.filter = 'Search';
			this.state = 'Suspect';
		}else if (searchkey )
		{
			this.filter = 'Search';

		}
		else if(state){
			switch (state){
				case 'alert':
					this.filter = 'Alerts';
					break;
				case 'suspect':
					this.filter = 'Suspects';
					this.state = 'Suspect';
					break;
				case 'case':
					this.range=false;
					this.filter = 'All';
					break;
				default:
					this.filter = 'All';
					break;
			}
		}


		if (telepath.access.admin || telepath.access.perm.Sessionflow_get){
			this.buildUI();
			this.loadSession(this.SID);
		}else{
			telepath.dialog({msg:'Access denied. No permissions to view Session Flow.'});
		};


	},
	loadSession: function() {

		this.mode = 'session';
		var that = this;
		this.container.empty().append(telepath.loader);
		
		that.session = {};
		
		// Load session stats, then items
		telepath.ds.get('/sessionflow/get_session_stats', { sid: that.SID, searchkey: that.searchkey, state: that.state, /*alerts: that.alerts_names, ip: that.IP ,*/ range: that.range }, function (data) {
			
			that.session.stats = data.items;
			
			telepath.ds.get('/sessionflow/get_sessionflow', { sid: that.SID, filter: that.filter, searchkey: that.searchkey, /*alerts: that.alerts_names, ip: that.IP ,*/ range: that.range }, function (data) {
				that.session.items = data.items;
				that.showSession();
			}, false, false, true);
			
		}, false, false, true);

	},
	buildUI: function() {
		
		var that = this;
		
		// Rebind
		$(document).unbind('keydown', telepath.sessionflow.keyDown);
		$(document).bind('keydown', telepath.sessionflow.keyDown);
		$(document).bind('overlay_destroy', telepath.alert.destroy);
		
		// Show loading
		telepath.overlay.init('alerts', 'Loading Sessionflow', true, 500);
		this.overlay = telepath.overlay;
		this.container = this.overlay.contentEl;
		
		if(this.list) {
			
			var total = 0;
			var index = 0;
			
			$('.tele-listitem', this.list).each(function () {
				var itemRID = $(this).data('tele-listitem').options.itemID;
				if(itemRID == that.SID) {
					index = total;
				}
				that.RIDS.push(itemRID);
				total++;
			});
			
			// 
			
			// Show pagination
			this.pagination = $('<div>').pagination({ 
				current: index, 
				count:   total, 
				name: that.alertsList ? 'Alert' : 'Session', 
				callback: function (itemIndex) {
					// console.log(itemIndex);
					that.SID = that.RIDS[itemIndex];
					that.loadSession();
					
				}
			});
			
			this.overlay.headerEl.append(this.pagination);
		
		}
	
	},
	showSession: function() {
		
		// Cleanup
		var that = this;
		this.container.empty();
		this.selectedIndex = 0;
		
		// Find selected index
		// ( is the RID index that initialized the session flow within the session )
		
		for(x in that.session.requests) {
			var request = that.session.requests[x];
			if(request.RID == that.RID) {
				this.selectedIndex = parseInt(x);
				break;
			}
			// Copy flows into requests
			for(y in that.session.flows) {
				var flow = that.session.flows[y];
				if(flow.RID == request.RID) {
					that.session.requests[x].business_id = flow.business_id;
					that.session.requests[x].business_status = flow.business_status;
				}
			}
		}
		
		// Build Layout
		this.boxLeft  = $('<div>').addClass('tele-box-left');
		this.boxMid   = $('<div>').addClass('tele-box-mid');
		this.boxRight = $('<div>').addClass('tele-box-right');
		//this.container.append(this.boxLeft, this.boxMid, this.boxRight);



		// Dynamically this.overlay.titleEl.html('Alert #' + this.alertID);

		this.width = window.innerWidth;
		if (this.width <= 1250){
			var width = this.overlay.contentEl.width();
			this.container.append(this.boxLeft, this.boxRight);
			var height = this.overlay.contentEl.height()-70;
			var mid_width = width - $(this.boxLeft).outerWidth() - 45;
			this.boxRight.css({'height':height}).width(mid_width)

		}
		else{
			var width = this.overlay.contentEl.width();
			this.container.append(this.boxLeft, this.boxMid, this.boxRight);
			var mid_width = width - $(this.boxLeft).outerWidth() - $(this.boxRight).outerWidth() - 50;
			this.boxMid.width(mid_width);

		}

		$('[class^="tele-box"]').on('mouseover', function() {
			that.selectedBox = $(this).attr("class").split('-')[2];
		});

		// Print Stats
		// ---------------------------------------------------
		var count_all     = this.session.stats.total;
		var count_alerts  = this.session.stats.alerts_count;
		var count_actions = this.session.stats.actions_count;
		var search_count  = this.session.stats.search_count;
		var suspect_count  = this.session.stats.suspect_count;

		var statsEl = $('<div>').addClass('tele-alert-stats');
		$.each({'All': count_all, 'Search': search_count, 'Alerts': count_alerts, 'Actions': count_actions, Suspect: suspect_count}, function(key, stat) {
			
			// Add filter if we have numeric vaue only, Yuli
			if (stat > 0)
			{
				var stat_filter = $('<div>').addClass('tele-alert-stat-key').html(key).click(function () {
					telepath.sessionflow.filter = key;
					telepath.sessionflow.loadSession();
					$('.tele-alert-stat-key').removeClass('active');
					//$(this).addClass('active');
					$( ".tele-alert-stat-key" ).filter( function ()
					{
						return $( this ).text().indexOf( key ) >= 0;
					}).addClass('active');
				});
			
				if(telepath.sessionflow.filter == key) {
					stat_filter.addClass('active');
				}

				var stateVal =$('<div>').addClass('tele-alert-stat-value').html(thousandsFormat(stat));
				if(stat.toString().length > 3 ){
					stateVal.attr('title', stat).tooltip();
				}
				statsEl.append($('<div>').addClass('tele-alert-stat').append(stat_filter).append(stateVal));
			}
			
		});
		this.boxLeft.append(statsEl);
		
		// --------------------------------------------------- 
		
			
		//// Print duration
		//// ---------------------------------------------------
		//var durationEl = $('<div>').addClass('tele-alert-duration')
		//			.append($('<div>').addClass('tele-alert-duration-start')
		//			.append($('<div>').addClass('tele-alert-duration-lbl').html('Started:'),
		//				$('<div>').addClass('tele-alert-duration-val').html(
		//					date_format('d/m/y | H:i A', this.session.stats.session_start))
		//				))
		//			.append($('<div>').addClass('tele-alert-duration-end')
		//			.append($('<div>').addClass('tele-alert-duration-lbl').html('Ended:'),
		//				$('<div>').addClass('tele-alert-duration-val').html(
		//					date_format('d/m/y | H:i A', this.session.stats.session_end))));
		//this.boxLeft.append(durationEl);
		//// ---------------------------------------------------
		//
		
		
		// Sort out list
		this.actionsContainer = $('<div>').addClass('tele-requests-list');
		this.boxLeft.append(this.actionsContainer);
		
		// Request Details
		this.requestDetails = $('<div>').addClass('tele-request-details').addClass('tele-popup-2');


		if (this.width <= 1250){
			this.boxRight.append(this.requestDetails)
		}
		else{
			this.boxMid.prepend(this.requestDetails);
		}

		// Print Requests
		this.lastAction = -1;
		this.printed = 0;

		for (var x in that.session.items) {
			var req = that.session.items[x];
			that.appendItem(req, x);
		}
		if (this.width <= 1250){
			var height = this.container.height() - statsEl.height() /*- durationEl.height()*/ - 70;
		}
		else{
			var height = this.container.height() - statsEl.height() /*- durationEl.height()*/ - 100;
		}

		// Infinitely load additional alerts
		$(this.actionsContainer).css({ 'height': height }); // Stats and times offset
		
		$(this.actionsContainer).mCustomScrollbar({ callbacks:{
				onTotalScroll:function(){
					
					if(that.loading) {
						return;
					}
				
					that.loading = true;
					
					$('.mCSB_container', that.actionsContainer).append($(telepath.loader).css({ float: 'left', clear: 'both', 'bottom': 30, position: 'absolute' }));
					
						var offset = that.session.items.length;
						
						telepath.ds.get('/sessionflow/get_sessionflow', { sid: that.SID, filter: that.filter, searchkey: that.searchkey, /*alerts: that.alerts_names, ip: that.IP,*/ offset: offset, range: that.range }, function (data) {
							that.loading = false;
							$('.tele-loader', that.actionsContainer).remove();
						
							if(data.items.length > 0) {
								var length = that.session.items.length;
								$.each(data.items, function(i, item) {
									that.session.items.push(item);
									that.appendItem(item, length + i);
								});
							}
							 
						}, false, false, true);
				},
			},
			scrollInertia: telepath.scrollSpeed,
			onTotalScrollOffset:200,
			alwaysTriggerOffsets:false,
			advanced:{ updateOnContentResize:true }
			});
			
		this.updateSelected();
		
		this.overlay.titleEl.html('Session Flow');
		
	},
	appendItem: function (req, index) {
		
		if(this.lastAction == -1 || (req.business_actions && (req.business_actions[0].name != this.lastAction || req.business_actions[0].status == 2)) || (!req.business_actions && this.lastAction != -1 && this.lastAction != 'Browsing')) {
				
			var action_name = req.business_actions ? req.business_actions[0].name : 'Browsing';
			
			this.actionContainer      = $('<div>').addClass('tele-alert-action');
			this.actionContainerIcon  = $('<div>').addClass('tele-alert-action-icon').addClass('tele-icon').addClass('tele-icon-suspect');
			
			this.actionContainerTitle = $('<div>').addClass('tele-alert-action-title')
												  .text(action_name);

			this.newList  = $('<ul class="tele-list">');

			this.actionContainer.append(this.actionContainerIcon)
								.append(this.actionContainerTitle)
								.append(this.newList);
			
			if($('.mCSB_container', this.actionsContainer).size() > 0) {
				$('.mCSB_container', this.actionsContainer).append(this.actionContainer);
			} else {
				this.actionsContainer.append(this.actionContainer);
			}
			
			this.lastAction = action_name;
			
		}
		
		var item = this.formatData(req);
		var newListItem = $('<li>').attr('id', 'alert-item-' + index);
		this.newList.append(newListItem);
		newListItem.listitem(item);

		$('.tele-title-2 span', newListItem).hover(function () {
			$(this).css('color', '#4174a7');
		}, function () {
			$(this).css('color', '#f00');
		});

		$('.tele-title-2 span', newListItem).click(function () {

			var search = 'alerts.name:"' + $(this).text() + '"';

			telepath.overlay.destroy();
			telepath.header.searchInput.val(search);
			telepath.ui.displayPage('search')
		});

		this.printed++;

		// We don't need to search alerts
		//$('.tele-title-2', newListItem).click(function () {
		//	telepath.overlay.destroy();
		//	var search = $(this).text();
		//	telepath.header.searchInput.val(search)
		//	telepath.search.init(search);
		//});


	},
	rowFormatter: function(item) {
		
		//if(item.score > item.score_avarage) { item.score_average = item.score; }
		return {
			icon: 'alert',
			time: item.ts, 
			progbar: true,
			itemID: item.uid,
			progbarBig: item.progbarBig,
			checkable: item.checkable,
			checked: item.checked,
			progbarValue: item.score_average,
			title: item.uri,
			details: [
				{ key: 'country', value: item.country_code },
				{ key: 'IP', value: item.orig_ip },
				{ key: 'city', value: item.city },
				//{ key: 'user', value: item.user_id }
			]
		};
	
	},
	filters: {
		H: true,
		P: true,
		G: true,
		J: true,
		X: true,
	},
	getSeverity: function(numeric_score) {
		
		var result = $('<div>').addClass('tele-severity');
		
		if(numeric_score > 0 && numeric_score < 70) {
			result.addClass('tele-severity-low').text('Low');
		}
		if(numeric_score >= 70 && numeric_score < 90) {
			result.addClass('tele-severity-medium').text('Medium');
		}
		if(numeric_score >= 90 && numeric_score < 100) {
			result.addClass('tele-severity-critical').text('Critical');
		}
		
		result.append('&nbsp;<span>(' + numeric_score + ')</span>');
		
		return result;
		
	},
	lookupAction: function(business_id) { // Action name for business_id
	
		for(x in telepath.actionList) {
			if(telepath.actionList[x].id = business_id) {
				return telepath.actionList[x].name;
			}
		}
		return 'Browsing';
		
	},
	lookupSimilarity: function(RID) {
		
		for(x in this.similarities.hits.hits) {
			var req = this.similarities.hits.hits[x];
			if(req._id == RID) {
				return req;
			}
		}
		return false;
		
	},
	lookupRequest: function(RID) { // Request for RID or false if not found
		for(x in this.session.items) {
			var req = this.session.items[x];
			if(req.uid == RID) {
				return req;
			}
		}
		
		for(x in this.similarities) {
			var req = this.similarities[x];
			if(req.uid == RID) {
				return req;
			}
		}
		
		return false;
	},
	delay: (function () {
		var timer = 0;
		return function (callback, ms) {
			clearTimeout(timer);
			timer = setTimeout(callback, ms);
		};
	})(),

	updateSelected: function(state) {

		var that = this;

		// arrow key navigation on similar requests (right column)
		if (this.selectedBox == 'right' && $('.tele-box-right .tele-list').length) {
			var selected = $('.tele-box-right .selected').parent().index();
			if ((this.similarities.hits.hits.length - 1 == selected && state == 'down') || (selected == 0 && state == 'up')) {
				return;
			}
			selected += state == 'up' ? -1 : +1;
			var newSelected = $('.tele-box-right li')[selected];

			this.expandSimilar(this.similaritiesList.teleList('option').data[selected]._source, newSelected);

			if ($('.selected', this.similaritiesList).length) {
				var elTop = $('.selected', this.similaritiesList).offset().top - $(".tele-similarities-list .mCSB_container").offset().top;
			}
			else {
				var elTop = 60;
			}
			$('.tele-similarities-list .tele-list').mCustomScrollbar("scrollTo", elTop - 50);
			return;
		}

		// arrow key navigation on regular requests (left column)
		if($('.selected', this.actionsContainer).length){
			var elTop = $('.selected', this.actionsContainer).offset().top - $(".tele-requests-list .mCSB_container").offset().top;
		}
		else {
			var elTop = 60;
		}
		$('.selected', this.actionsContainer).removeClass('selected');
		var newSelected = $("#alert-item-" + this.selectedIndex, this.actionsContainer).first();
		$('.tele-listitem-inner', newSelected).addClass('selected');
		
		if(newSelected.data('tele-listitem') && newSelected.data('tele-listitem').options) {
			var dataID = newSelected.data('tele-listitem').options.dataID;
		} else {
			newSelected = $("#alert-item-" + this.selectedIndex, this.actionsContainer);
			var dataID = newSelected.data('tele-listitem').options.dataID;
		}

		// delay similar server request, and send the request only if same request still selected
		this.delay(function () {
			that.expandRequest(dataID);
		}, 500);

		$('.tele-requests-list').mCustomScrollbar("scrollTo", state == 'up' ? elTop - 400 : elTop - 50);
	},
	scrollUp: function() {
		if(this.selectedIndex > 0) {
			this.selectedIndex--;
		}
		this.updateSelected('up');
	},
	scrollDown: function() {
		if(this.selectedIndex < this.session.items.length -1) {
			this.selectedIndex++;
		}
		this.updateSelected('down');
	},
	keyDown: function(e) {
		// Up/Down Navigation
		if(e.keyCode == '38') { e.preventDefault(); telepath.sessionflow.scrollUp(); }
		if(e.keyCode == '40') { e.preventDefault(); telepath.sessionflow.scrollDown(); }
		
	},
	destroy: function() {
		// Unbind
		$(document).unbind('overlay_destroy', telepath.alert.destroy);
		$(document).unbind('keydown', telepath.alert.keyDown);
	},
	initAlertTools: function() {
		
		// Archive Alert
		this.archiveAlert = $('<div>').btn({ icon: 'archive', text: 'Archive Alert', callback: function () { }});
		
		// Move To
		this.moveTo = $('<div>').teleDropdown({ icon: 'moveTo', value: 'Move To', callback: function () {	}});
		
		// Edit Rule
		this.editRule = $('<div>').btn({ icon: 'editRule', text: 'Edit Rule', callback: function () { }});
		
		var wrap = $('<div>').addClass('tele-overlay-tools');

		wrap.append('<div class="tele-navsep"></div>')
			.append(this.archiveAlert)
			.append('<div class="tele-navsep"></div>')
			.append(this.moveTo)
			.append('<div class="tele-navsep"></div>')
			.append(this.editRule);
		
		this.overlay.headerEl.append(wrap);
		
	},
	initRequestTools: function() {
		
		// Harmful
		this.harmfulBtn = $('<div>').btn({ icon: 'harmful', text: 'Mark as Harmful', callback: function () { }});
				
		// Safe
		this.safeBtn = $('<div>').btn({ icon: 'safe', text: 'Not harmful', callback: function () { }});
		
		// Archive 
		this.archiveBtn = $('<div>').btn({ icon: 'archive', text: 'Archive', callback: function () {  }});

		var wrap = $('<div>').addClass('tele-overlay-tools');

		wrap.append('<div class="tele-navsep"></div>')
			.append(this.harmfulBtn)
			.append('<div class="tele-navsep"></div>')
			.append(this.safeBtn)
			.append('<div class="tele-navsep"></div>')
			.append(this.archiveBtn);
		
		this.overlay.headerEl.append(wrap);
		
	},
	formatData: function(item) {
		
		var that = this;
		
		if(item._id) { item._source.uid = item._id }
		if(item._source) { item = item._source }
		
		var result = {};
		
		// Sometimes its malformed
		try {
			//result.title = decodeURIComponent(item.title ? item.title : item.uri);
			result.title = item.title ? item.title : item.uri;
		} catch(e) {
			result.title = '';
		}
		

		result.state = 'sessionFlow';
		result.progbar = true;
		result.time    = item.ts;
		result.timeFormat = 'h:i A';
		result.offset = 20;
		result.icon   = 'suspect';
		result.dataID = item.uid;
		
		result.raw = item;
		
		var alert = item.alerts_count > 0;
		
		//if(item.score > item.score_average) { item.score_average = item.score }
		
		/*if(item.alerts_count > 0) {
			$.each(item.alerts, function (i, x) {
				if(x.score > item.score_average) {
					item.score_average = x.score;
				}
			});
		}*/

		result.progbarValue = item.score_average;

		if(alert !== false) {
			result.icon   = 'alert';
			var alerts = '';
			$.each(item.alerts, function (i, x) {
				alerts += x.name + ', ';
			});
			result.description = alerts.slice(0,-2);
			//alert = item.alerts[0];
			//result.description  = alert.name;
			//result.progbarValue = item.score_average;
		}
		//else {
		//	if(item.score_average > 85) {
		//		result.icon = 'suspect_red';
		//	}
		//}
		
		result.callback = function (widget, el) {
			$('.selected', that.actionsContainer).removeClass('selected');
			$('.tele-listitem-inner', widget.element).addClass('selected');
			that.selectedIndex = $(widget.element).attr('id').split('-')[2] ;
			that.expandRequest(widget.options.dataID);
		};

		return result;
		
	},
	showAlert: function(data) {
		
	},
	expandRequest: function(uid) {

		// Store last selected request ID, in case of multiple selections
		this.currentUID = uid;

		var that = this;
	
		this.requestDetails.empty();
		// remove id from html
		//this.requestDetails.append(uid);
		this.requestDetails.append(telepath.loader);
		
		var req = this.lookupRequest(uid);
		if(req) {
			this.requestInfo = req;
		} else {
			// console.log('RID ' + uid + ' was not found in requests');
			return;
		}

		
		this.boxRight.empty();

		this.headerRight = $('<div>').addClass('tele-overlay-header-right');

		this.boxRight.append(this.headerRight);

		this.printRequestInfo(this.headerRight);

		// Request scores
		this.printRequestScores(req, this.headerRight);

		// Alert information
		var alert = req.alerts_count > 0;

		$('.tele-overlay-tools', this.overlay.headerEl).remove();


		if (this.width <= 1250){
			//$('.mCSB_container', this.boxRight).append(this.requestDetails)
			this.boxRight.append(this.requestDetails)
			this.boxRight.css({ "overflow-y": "scroll"})
		}

		// temporary dismiss this features
		//if(alert !== false) {
		//	// TODO: Debug Icons
		//	//this.initAlertTools();
		//	this.initRequestTools();
		//} else {
		//	this.initRequestTools();
		//}

		// Display parameters data
		this.requestData = this.requestInfo;
		this.printParams();

		telepath.sessionflow.reloadFlag = Date.now();
		this.boxRight.mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
		// Load similarities
		telepath.ds.get('/similarities/', { param_type: 'request', uid: uid }, function(data, flag) {
			if (flag && telepath.sessionflow.reloadFlag && flag != telepath.sessionflow.reloadFlag)
			{
				// session flow item was changed !
				return;
			}
			that.showSimilarities(data.items);
		}, null, telepath.sessionflow.reloadFlag, true);
		
		// Load param data
		$('.tele-similarity-details').remove();
		//telepath.ds.get('/sessionflow/get_sessionflow_params', { uid: uid }, function(data, flag) {
		//	if (flag && telepath.sessionflow.reloadFlag && flag != telepath.sessionflow.reloadFlag)
		//	{
		//		// session flow item was changed !
		//		return;
		//	}
		//	that.expandRequestData(data.items);
		//}, null, telepath.sessionflow.reloadFlag, true);



	},

	expandSimilar: function(requestData,element){

		this.requestData = requestData;

		$(element).parent().find('.tele-listitem-inner.selected').removeClass('selected');
		$('.tele-listitem-inner', element).addClass('selected');

		if(this.similarityDetails) {
			this.similarityDetails.remove();
		}
		$('.tele-similarity-details').remove();
		this.similarityDetails = $('<div>').addClass('tele-request-details tele-similarity-details').addClass('tele-popup-2').css({ marginTop: '2%' });

		var wrap = $('<div>').addClass('tele-alert-details-info');

		this.requestData.score_average = parseFloat(this.requestData.score_average);

		//if(this.requestData.score > this.requestData.score_average) { this.requestData.score_average = this.requestData.score }
		if(this.requestData.score_average > 0 && this.requestData.score_average <= 1) {
			this.requestData.score_average = this.requestData.score_average * 100;
		}

		// Severity
		var severityPercent         = parseInt(this.requestData.score_average) + '%';
		this.alertSeverityWrap      = $('<div>').addClass('tele-alert-severity-wrap');
		this.alertSeverityLabel     = $('<div>').addClass('tele-alert-severity-label').text('Severity');
		this.alertSeverityPercent   = $('<div>').addClass('tele-alert-severity-percent').text(severityPercent);
		this.alertSeverityProgBar   = $('<div>').addClass('tele-alert-severity-progbar');
		this.alertSeverityProgValue = $('<div>').addClass('tele-alert-severity-progbar-value').css({ width: severityPercent });

		this.alertSeverityWrap.append(this.alertSeverityLabel).append(this.alertSeverityPercent).append(this.alertSeverityProgBar);
		this.alertSeverityProgBar.append(this.alertSeverityProgValue);

		wrap.append(this.alertSeverityWrap);


		// Title
		var title = $('<div>').addClass('tele-alert-details-info-title');
		this.printLink(this.requestData, title);

		// Time
		this.alertDetailsTimeWrap   = $('<div>').addClass('tele-alert-details-info-time-wrap');
		this.alertDetailsTimeLabel  = $('<div>').addClass('tele-alert-details-info-time-label').text('Request time:');
		this.alertDetailsTime  		= $('<div>').addClass('tele-alert-details-info-time').text(date_format('d/m/y | H:i:s', this.requestData.ts));
		this.alertDetailsTimeWrap.append(this.alertDetailsTimeLabel).append(this.alertDetailsTime);

		// Response status
		this.alertDetailsResponseWrap   = $('<div>').addClass('tele-alert-details-info-response-wrap');
		this.alertDetailsResponseLabel  = $('<div>').addClass('tele-alert-details-info-response-label').text('Response Status:');
		this.alertDetailsResponse  		= $('<div>').addClass('tele-alert-details-info-response').text( this.requestData.status_code);
		this.alertDetailsResponseWrap.append(this.alertDetailsResponseLabel).append(this.alertDetailsResponse);

		// Operation mode
		this.alertDetailsOperationWrap   = $('<div>').addClass('tele-alert-details-info-operation-wrap');
		this.alertDetailsOperationLabel  = $('<div>').addClass('tele-alert-details-info-operation-label').text('Operation Mode:');
		var operationMode = this.requestData.operation_mode == 1 ? 'Training' : (this.requestData.operation_mode == 2 ? 'Production' : 'Hybrid');
		this.alertDetailsOperation  		= $('<div>').addClass('tele-alert-details-info-operation').text( operationMode);
		this.alertDetailsOperationWrap.append(this.alertDetailsOperationLabel).append(this.alertDetailsOperation);

		wrap.append(title).append(this.alertDetailsTimeWrap).append(this.alertDetailsResponseWrap).append(this.alertDetailsOperationWrap);

		this.similarityDetails.append(wrap);

		this.printParamsTable(this.similarityDetails);

		if (this.width <= 1250) {
			$('.tele-similarities-list.tele-block').before(this.similarityDetails.hide().fadeIn(function(){
				$('.tele-box-right').mCustomScrollbar('update');
			}));
		}
		else{
			this.boxMid.append(this.similarityDetails);
			this.similarityDetails.mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
		}
		this._resize()
		//this.resizeMid();
	},
	//expandRequestData: function(data) {
	//	$('.loader', this.requestDetails).remove();
	//	this.requestData = data;
	//
	//	this.updateTitle(this.requestData);
	//
	//	this.printParams();
	//},
	//updateTitle: function(request) {
	//
	//	// Lookup alert
	//	var alert = this.lookupAlert(request.RID);
	//
	//	// Page name
	//	var title = request.title != '' ? request.title : request.display_path;
	//
	//	// Alert name
	//	if(alert !== false) {
	//		title = alert.name;
	//	}
	//
	//	// Update title
	//	this.overlay.titleEl.html(title);
	//
	//},
	printParams: function(container) {
		var container = this.requestDetails;
		container.empty();
		this.printParamsFilters(container);
		this.printAlertDetails(container);
		this.printParamsTable(container);
		this.requestDetails.mCustomScrollbar({ scrollInertia: telepath.scrollSpeed });
	},
	printParamsFilters: function(container) {
		
		var that = this;
		this.filtersContainer = $('<div>').addClass('tele-alert-filters');
		container.append(this.filtersContainer);
		
		var filters = [
			{ type: 'H', label: 'Headers' },
			{ type: 'G', label: 'Get' },
			{ type: 'P', label: 'Post' },
			{ type: 'J', label: 'Json' },
			{ type: 'X', label: 'XML' }
		];
		
		$.each(filters, function (i, filter) {
			var filter_el = $('<div>').teleCheckbox({ 
				checked: telepath.alert.filters[filter.type], 
				label: filter.label, 
				inputFirst: true,
				alertObj: that,
				callback: function (widget) {
					telepath.alert.filters[filter.type] = widget.options.checked;
					this.alertObj.printParams();
                    //filtering for the second table
                    $('.tele-listitem-inner.selected').click();
			}});
			that.filtersContainer.append(filter_el);
		});
		
	},
	printLink: function(request, container) {
		
		
		
		var path = 'http://' + request.host + request.uri;
		// Add get parameters to URL
		var get_params = {};
		$.each(request.parameters, function (i, param) {
			if (param.type == 'G') {
				get_params[param.name] = param.value;
			}
		});
		if (!$.isEmptyObject(get_params)) {
			path += '?' + $.param(get_params);
		}
		var link = $('<a>').attr('target', '_blank').text(path).attr('href',path ).attr('title' ,path);
		var action = request.business_id ? this.lookupAction(request.business_id) : 'Browsing';
		container.append(link);
		container.append('&nbsp;(' + action + ')');
	
	},
	printAlertDetails: function(container) {
	
		// Container
		this.alertDetails = $('<div>').addClass('tele-alert-details-info');
		container.append(this.alertDetails);

		// Title
		this.alertDetailsTitle = $('<div>').addClass('tele-alert-details-info-title');
		this.printLink(this.requestInfo, this.alertDetailsTitle);
		
		// Time
		this.alertDetailsTimeWrap   = $('<div>').addClass('tele-alert-details-info-time-wrap');
		this.alertDetailsTimeLabel  = $('<div>').addClass('tele-alert-details-info-time-label').text('Request time:');
		this.alertDetailsTime  		= $('<div>').addClass('tele-alert-details-info-time').text(date_format('d/m/y | H:i:s', this.requestInfo.ts));
		this.alertDetailsTimeWrap.append(this.alertDetailsTimeLabel).append(this.alertDetailsTime);

		// Response status
		this.alertDetailsResponseWrap   = $('<div>').addClass('tele-alert-details-info-response-wrap');
		this.alertDetailsResponseLabel  = $('<div>').addClass('tele-alert-details-info-response-label').text('Response Status:');
		this.alertDetailsResponse  		= $('<div>').addClass('tele-alert-details-info-response').text( this.requestInfo.status_code);
		this.alertDetailsResponseWrap.append(this.alertDetailsResponseLabel).append(this.alertDetailsResponse);

		// Operation mode
		this.alertDetailsOperationWrap   = $('<div>').addClass('tele-alert-details-info-operation-wrap');
		this.alertDetailsOperationLabel  = $('<div>').addClass('tele-alert-details-info-operation-label').text('Operation Mode:');
		var operationMode = this.requestInfo.operation_mode == 1 ? 'Training' : (this.requestInfo.operation_mode == 2 ? 'Production' : 'Hybrid');
		this.alertDetailsOperation  		= $('<div>').addClass('tele-alert-details-info-operation').text( operationMode);
		this.alertDetailsOperationWrap.append(this.alertDetailsOperationLabel).append(this.alertDetailsOperation);
		
		//if(this.requestData.score > this.requestData.score_average) { this.requestData.score_average = this.requestData.score }
		
		// Severity
		//if(this.requestData.score_average > 0 && this.requestData.score_average <= 1) {
		//	this.requestData.score_average = this.requestData.score_average * 100;
		//}
		var severityPercent         = parseInt(this.requestData.score_average * 100) + '%';
		this.alertSeverityWrap      = $('<div>').addClass('tele-alert-severity-wrap');
		this.alertSeverityLabel     = $('<div>').addClass('tele-alert-severity-label').text('Severity');
		this.alertSeverityPercent   = $('<div>').addClass('tele-alert-severity-percent').text(severityPercent);
		this.alertSeverityProgBar   = $('<div>').addClass('tele-alert-severity-progbar');
		this.alertSeverityProgValue = $('<div>').addClass('tele-alert-severity-progbar-value').css({ width: severityPercent });
		
		this.alertSeverityWrap.append(this.alertSeverityLabel).append(this.alertSeverityPercent).append(this.alertSeverityProgBar);
		this.alertSeverityProgBar.append(this.alertSeverityProgValue);
		
		this.alertDetails.append(this.alertSeverityWrap).append(this.alertDetailsTitle).append(this.alertDetailsTimeWrap)
			.append(this.alertDetailsResponseWrap).append(this.alertDetailsOperationWrap);
		
	},
	printRequestInfo: function(container) {
		
		// Setup containers
		
		this.alertInfo      = $('<div>').addClass('tele-alert-info');
		//this.alertInfoTitle = $('<div>').addClass('tele-alert-info-title').text(alert.name);
		//this.alertInfoLabel = $('<div>').addClass('tele-alert-info-label').text('Description:');
		//this.alertInfoDesc  = $('<div>').addClass('tele-alert-info-description').text(alert.description);
		this.alertInfoTable = $('<div>').addClass('tele-alert-info-table');
	
		function getRow(lbl, data) {
			var row = $('<tr>');
			var td_1 = $('<td>').html(lbl).addClass('tele-alert-info-key');
			var td_2 = $('<td>').html(data).addClass('tele-alert-info-value');
			row.append(td_1).append(td_2);
			return row;
		}
		
		// Fill table data
		var table = this.alertInfoTable;
		
	//	table.append(getRow('Time:', date_format('d/m/y | H:i:s', this.requestInfo.ts)));
		table.append(getRow('Session Start:', date_format('d/m/y | H:i:s', this.session.stats.session_start)));
		table.append(getRow('Session End:', date_format('d/m/y | H:i:s', this.session.stats.session_end)));
		//table.append(getRow('Severity:', this.getSeverity(alert.numeric_score)));
		table.append(getRow('Application:', this.requestInfo.host));
		table.append(getRow('IP:', this.requestInfo.ip_orig));
		table.append(getRow('Location:', (this.requestInfo.country_code!='00'?'<span class="flag flag-' + this.requestInfo.country_code + '"></span>':'') +
							'<span class="tele-country">' + telepath.countries.a2n(this.requestInfo.country_code) + '</span>'));
		if(this.requestInfo.username){
			table.append(getRow('User:', this.requestInfo.username));
		}


		$('tr:nth-child(n+3) .tele-alert-info-value', table).hover(function () {
			var search = $(this).text();
			if (search != 'Unknown') {
				$(this).css('cursor', 'url(img/search_icon.png), pointer');
				$(this).css('color','#4174a7');
			}
		},function(){
			$(this).css('color','#333333');
		});
		$('tr:nth-child(n+3) .tele-alert-info-value', table).click(function () {
			var search = $(this).text();
			if (search != 'Unknown') {

				var field = $(this).parent().text().split(':')[0] .replace(/Application/g, 'host')
					.replace(/IP/g, 'ip_orig').replace(/Location/g, 'country_code');


				if (field == 'country_code')
				{
					$.each(telepath.countries.map, function (k, val) {
						if (val.toLowerCase() == search.toLowerCase()) {
							search = k;
						}
					});
				}


				telepath.overlay.destroy();
				telepath.header.searchInput.val(field + ':"' + search + '"');
				telepath.search.init(field + ':"' + search + '"');
			}
		});
		//if(alert.user && alert.user != '') {
		//	table.append(getRow('User:', alert.user));
		//}
		
				
		// Append All
	/*	this.alertInfo.append(this.alertInfoTitle)
//					  .append(this.alertInfoLabel)
					  .append(this.alertInfoDesc)
					  .append();
		*/			  
		container.append(this.alertInfoTable);
		
	
	},
	printParamsTable: function(container) {
		
		var tableWrap = $('<div>').addClass('tele-alert-params-table-wrap');
		var table 	  = $('<table>').addClass('tele-alert-params-table');
		
		var tableWidth = (parseInt(this.boxMid.css('width')) - 50);
	
		$.each(this.requestData.parameters, function(i, param) {

			var param_display = telepath.alert.filters[param.type];
			if(param_display) {
				
				var row = $('<tr>');
				var col_name  = $('<td>').addClass('tele-param-name').html(param.name).attr('title',param.name);
				var col_data  = $('<td>').addClass('tele-param-data').html(param.value);
				var col_score = $('<td>').addClass('tele-param-score').html(parseInt(param.score_data) + '%');
				
				/*if(parseInt(param.attribute_score_normal)) {
					col_score.addClass('severe');
					col_data.addClass('severe');
				}*/
				if (parseInt(param.score_data)>30){
					row.css({"color":"red"})
				}
				row.append(col_name).append(col_data).append(col_score);
				table.append(row);
				
			}
			
		});
		
		container.append(tableWrap);
		tableWrap.append(table);
		
		//$(tableWrap).mCustomScrollbar({ advanced:{ updateOnContentResize: true } });
		
	}
	
}
