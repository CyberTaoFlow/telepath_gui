// Cant create telepath.case, reserved word :{}
telepath['case'] = {

	rowFormatter: function(item,mode) {

		if(item._source) { item = item._source }
		if (mode!='search'){
			item.data = item.case_data.details;

			var details = [];
			$.each(item.data, function(i, condition) {
				details.push({ key: condition.type, value: telepath.formatConditionBrief(false, condition) });
			});
		}

		// Just in case defaults
		if(!item.checkable) {
			item.checkable = false;
		}
		if(!item.favorites) {
			item.favorites = false;
			item.favorite  = false;
		}

		if(mode == 'dashboard'){
				var result = {
				details: details,
				dataID:  item.name,
				icon: 'case',
				title: item.name,
				//time: item.created,
				count: item.count,
				time: item.last_time,
				favorite: item.favorite,
				state: 'dashboard',
				};
		}
		else if(mode == 'search'){
			var case_names = '';
			$.each(item.cases_names, function (i, x) {
				case_names = case_names + x.key + ' ,'
			});
			case_names = case_names.substr(0, case_names.length - 2);

			var result = {
				raw: item,
				checkable: false,
				favorites: false,
				favorite: false,
				itemID: item.sid,
				icon: 'case',
				title: case_names,
				count: item.count,
				time: item.date,
				progbar: true,
				progbarValue: item.score_average,
				details: [
					{key: 'IP', value: item.ip_orig},
					{key: 'country', value: item.country},
					{key: 'city', value: item.city},
					{key: 'host', value: grabNames(item.host)},
					{key: 'alerts', value: item.alerts_count},
					{key: 'actions', value: item.actions_count},
					{key: 'user', value: item.user }
				]
			};
		}
		else{
				var result = {
				checkable: item.checkable,
				favorites: item.favorites,
				favorite: item.favorite,
				dataID:  item.name,
				icon: 'case',
				// mark deleted cases (Yuli)
				title: item.name /* + (('empty' in item.case_data ) ? ' ***deleted***': '') */,
				//time: item.created,
				count: item.count,
				updating: item.case_data.updating,
				details: details,
				time: item.last_time
			};
		}

		return result;

	}

}

telepath.caseOverlay = {

	addCase: function () {
		this.initUI({ id: 'new', case_data: { case_name: 'New Case', details: [] } });
	},
	editCase: function(data) {
		this.initUI(data);
	},
	initUI: function (data) {
		
		var that = this;
		this.data = data;
		
		// console.log(this.data);
		
		// Show Window
		telepath.overlay.init('case-edit', data.case_data.case_name, true, 550);

		// Case Name
		var caseName = $('<div>').teleInput({ label: 'Name', value: data.id == 'new' ? '' : data.case_data.case_name, disabled: data.id == 'new' ? false : true });
		
		//if(data.id != 'new') {
		//	caseName.attr('disabled', 'disabled');
		//}
		
		telepath.overlay.contentEl.append(caseName);
		
		// Title
		var title = $('<div>').addClass('tele-title-1').text('Traffic matching following conditions will be aggregated into this case');
		telepath.overlay.contentEl.append(title);
		
		// Condition list
		var cond = $('<div>').conditionList({data: data.case_data.details}).mCustomScrollbar({
			advanced: {
				updateOnContentResize: true
			},
			scrollInertia: telepath.scrollSpeed
		}).height($('.tele-overlay').height() - 250);
		telepath.overlay.contentEl.append(cond);
		
		// Apply / Cancel buttons
		
		var btnContain = $('<div>').addClass('tele-button-container');
		var saveBtn   = $('<a class="tele-button tele-button-apply">Save</a>');
		var cancelBtn  = $('<a class="tele-button tele-button-cancel">Cancel</a>');
		
		btnContain.append(saveBtn).append(cancelBtn);
		
		telepath.overlay.contentEl.append(btnContain);
		
		//var jsonTEXT = $('<textarea>').addClass('tele-condition-debug').hide();
		//telepath.overlay.contentEl.append(jsonTEXT);
		
		// Callbacks
		saveBtn.click(function () {
			
			var json = cond.data('tele-conditionList').getJSON();
			
			var name = caseName.data('tele-teleInput').input.val();
			
			caseName.removeClass('error');
			if(name.length == 0 || name.length > 32) {
				caseName.addClass('error');
				return;
			}
			if(json.length == 0) {
				telepath.dialog({ title: 'Case Editor', msg: 'Must have at least one condition' });
				return;
			}

			$('.tele-icon-case-edit').append(telepath.loader).css({ backgroundColor: '#555' });
			
			if(that.data.id == 'new') {
			
				telepath.ds.get('/cases/add_case', { name: name, case_data: JSON.stringify(json) }, function (data) {
					
					if(data.items.existing) {
						
						telepath.dialog({ title: 'Case Editor', msg: 'Already have a case with this name' });
						return;
						
					}

					telepath.cases.deleteCasesCache();
					
					telepath.overlay.destroy();
					//telepath.casePanel.init(name);
					telepath.cases.refresh(function () {});



					telepath.ds.get('/cases/flag_requests_by_cases', { case: [name], range: false, method: 'add' }, function (data) {
						// console.log('New case was flagged' + data);
						telepath.cases.deleteCasesCache();
						telepath.cases.refresh(function () {});
					});
						
				});
				
			} else {
				
				telepath.ds.get('/cases/set_case', { name: name, case_data: JSON.stringify(json) }, function (data) {
					
					if(data.existing) {
						
						telepath.dialog({ title: 'Case Editor', msg: 'Already have a case with this name' });
						return;
						
					}

					telepath.cases.deleteCasesCache();

					telepath.overlay.destroy();
					//telepath.casePanel.init(name);
					telepath.cases.init();


					telepath.ds.get('/cases/flag_requests_by_cases', { case: [name], range: false, method: 'update'  }, function (data) {
						// console.log('Update the case:' + data);
						telepath.cases.deleteCasesCache();
						telepath.cases.refresh();
					});
					
				});
			
			}
			
			

		});
		
		cancelBtn.click(function () {
		
			telepath.overlay.destroy();
			
		});
		
	}

}

telepath.casePanel = {
	
	data: {},
	sort: 'date',
	dir: false,
	displayed: [],
	loading: false,
	init: function (caseID) {

		// Remove existing panels if any
		$('.tele-panel-case').remove();
		// Create new container
		this.container = $('<div>').addClass('tele-panel-case');
		// Add to cases panel
		$('.tele-panel-cases').append(this.container);
		// Hide the rest of the panel
		$('.tele-panel-cases-inner').hide();
		
		this.panelTopBar  = $('<div>').addClass('tele-panel-topbar');
		this.panelTitle   = $('<div>').addClass('tele-panel-title');
		
		this.panelTopBar.append(this.panelTitle);
		this.panelTitle.html('Loading Case: ' + caseID);
		
		this.container.append(this.panelTopBar);
		this.container.append(telepath.loader);
	
		this.getData(caseID);
				
	},
	refresh: function (callback) {

		var that = this;

		this.displayed = [];

		this.loading = true;
		$('.tele-panel-cases .tele-panel-topbar-right').addClass('wait');

		$(".tele-case-graph, .tele-wrapper, .tele-panel-subtitle, .tele-infoblock, .mCustomScrollbar, .tele-loader", this.container).remove();
		this.container.append(telepath.loader);

		telepath.ds.get('/cases/get_case_sessions', {
			sort: this.sort,
			dir: this.dir,
			cid : this.caseID
		}, function (data) {
			if(data.items){
				that.data = data.items;

				telepath.ds.get('/cases/get_case_data', {
					cid : that.caseID
				}, function (data) {
					that.loading = true;
					$('.tele-panel-cases .tele-panel-topbar-right').removeClass('wait');
					if(data){
						that.loadData(data.items);
					}
				}, false, false, true);

				data.items.items.map(function (a) {
					that.displayed.push(a.sid)
				});
			}else{
				that.loading = true;
				$('.tele-panel-cases .tele-panel-topbar-right').removeClass('wait');
			}

			if(typeof(callback) == 'function') {
				callback();
			}
		}, false, false, true);

	},
	hardRefresh: function(callback){
		deleteCache('telecache');
		this.refresh(callback);
	},
	getData: function(caseID) {
		this.caseID = caseID;
		this.refresh();
	},
	loadData: function(data) {
		
		var that = this;
		this.data.case = data.case;
		this.data.chart = data.chart;
		if(this.data.items.length){
			this.data.similars = data.similars;
		}

		$('.tele-loader', this.container).remove();
		//$(".tele-case-graph, .tele-wrapper, .tele-panel-subtitle, .tele-infoblock, .mCustomScrollbar", this.container).remove();

		this.panelTopBar.empty();

		// Case Title
		this.panelTitle   = $('<div>').addClass('tele-panel-title');
		this.panelTopBarRight = $('<div>').addClass('tele-panel-topbar-right');
		this.panelTopBar.append(this.panelTitle).append(this.panelTopBarRight);
		var HebrewChars = new RegExp("^[\u0590-\u05FF]+$");
		var caseName= this.data['case']['case_data']['case_name'];
		var lang = HebrewChars.test(caseName);
		var text = lang ? $('<div>').attr('dir', 'ltr').addClass("session-count").html('&nbsp; | ' + thousandsFormat(this.data.count) + ' Sessions') :
			$('<div>').addClass("session-count").html('&nbsp; | ' + thousandsFormat(this.data.count) + ' Sessions');
		var title = $('<div>').addClass('case-title').html(caseName).attr('title',caseName);
		this.panelTitle.append(title).append(text);

		// Case Favorite Flag
		this.favEl = $('<a>').cb({ icon: 'favorites', checked: data['case']['favorite'] == '1', callback: function(widget) {
			
			telepath.ds.get('/cases/set_case_fav', {
				cid: that.caseID,
				favorite: widget.options.checked
			}, function (data) {
				telepath.cases.deleteCasesCache();
			});
		
		}});
		
		this.panelTopBar.prepend(this.favEl);
			
		// Case Description
		this.caseDesc = $('<div>').addClass('tele-panel-description');
		
		$.each(data['case']['case_data']['details'], function(i, condition) {
			
			var cTitle = $('<span>').html(condition.type + ':&nbsp;');
			var cData  = $('<span>').html(telepath.formatConditionBrief(false, condition));
			that.caseDesc.append(cTitle).append(cData).append('<span>&nbsp;|&nbsp;</span>');

		});
		$('span:last', that.caseDesc).remove();

		this.caseDesc.attr('title',this.caseDesc.text());
		
		// Go Back Button
		this.goBack = $('<a>').addClass('tele-panel-case-close').html('|&nbsp;Back to all cases');
		this.panelTopBar.append(this.goBack);
		
		// Refresh
		var cmdRefresh = $('<div>').addClass('tele-refresh');
		var cmdRefreshButton = $('<a>').addClass('tele-refresh-button').html('&nbsp;');
		cmdRefresh.append(cmdRefreshButton);

		cmdRefreshButton.click(function () {
			telepath.casePanel.hardRefresh();
		});

		// Edit Case
		this.editCase = $('<div>').btn({ icon: 'caseConfig', text: 'Edit Case', callback: function () {
			telepath.caseOverlay.editCase(that['data']['case']);			
		}});

		// Temporary Hide Archive Case
		// this.panelTopBar.append('<div class="tele-navsep"></div>');
		

		//this.archiveCase = $('<div>').btn({ icon: 'archive', text: 'Archive Case', callback: function () {
		//
		//}});
		//this.panelTopBar.append(this.archiveCase);

		// Sort filters
		var sortRadios = $('<div>').radios({
			title: 'Sort By',
			items: [
				{id: 'date', icon: 'time', tip: 'Time', dir: that.dir},
				{id: 'count', icon: 'bars', tip: 'Count', dir: that.dir},
				//{id: 'score', icon: 'alerts', tip: 'Score'}
			],
			selected: this.sort,
			callback: function(e, id) {
				if(that.sort == id) {
					that.dir = !that.dir;
				}
				$.each(e.options.items, function(i,v){
					if (v.id==id){
						e.options.items[i].dir=that.dir;
					}
				});
				that.sort = id;
				that.refresh();
			}
		});

		// DateRange
		var filterDateRange 	  = $('<div>').daterange({

			start: telepath.range.start,
			end: telepath.range.end,
			change: function(start, end) {

				telepath.range.start = start;
				telepath.range.end = end;

				that.hardRefresh();

			}});

		// Applications
		var filterApps		     = $('<div>').appSelect({ callback: function (app_id) {
			$('.tele-icon-application', filterApps).removeClass('tele-icon-application').addClass('tele-icon-loader');
			that.hardRefresh(function () {
				$('.tele-icon-loader', filterApps).removeClass('tele-icon-loader').addClass('tele-icon-application');
			});
		}});


		this.panelTopBarRight.append(this.editCase)
			.append('<div class="tele-navsep"></div>').append(sortRadios)
			.append('<div class="tele-navsep"></div>').append(filterDateRange)
			.append('<div class="tele-navsep"></div>').append(filterApps)
			.append('<div class="tele-navsep"></div>').append(cmdRefresh);

		// Description
		this.panelTopBar.append(this.caseDesc);

		this.goBack.click(function () {
			// Remove this panel
			$('.tele-panel-case').remove();
			// Refresh list of cases whn back button pressed (Yuli)
			telepath.cases.init();
			// Restore visibility to all cases
			//$('.tele-panel-cases-inner').show();
		});

		/* CASE CHART */
		/* ********************************************** */

		var chartData = [{ label: "random", data: this.data.chart, color: '#5191D1' }];
		var options = {
					
			legend: { show: false },
			series: { lines: { show: true, fill: true }, points: { show: true, fillColor: '#446077' } },
			yaxis: { alignTicksWithAxis: true, labelWidth: 30, ticks: 5, color: '#446077', font: { family: 'Arial', color: '#cccccc', size: 11, weight: "normal" } },
			selection: { mode: "x" },
			xaxis: { alignTicksWithAxis: true, tickColor: '#cccccc', tickLength: 7, font: { family: 'Arial', color: '#cccccc', size: 11, weight: "normal" }, mode: "time", timezone: "browser", timeformat: "%d/%m" },
			grid: { borderColor: '#446077', borderWidth: 1 }
			
		};

		var caseGraph = $('<div>').addClass('tele-case-graph');

		this.container.append(caseGraph);
		
		caseGraph.flotGraph({ data: chartData, options: options });
		// Append All

		var graphTitle = $('<div>').addClass('tele-graph-title').html('Case Sessions');

		caseGraph.prepend(graphTitle);
		
		
		/* CASE SUB-BAR */
		/* ****************************************** */
		
		this.panelSubBar  = $('<div>').addClass('tele-panel-subtitle');
		this.container.append(this.panelSubBar);
		
		// Check All
		var checkallEl = $('<a>').cb({ callback: function (e) {
			$('.tele-panel-cases .tele-list li.tele-listitem').listitem("option", "checked", e.options.checked);
		}});
		this.panelSubBar.append(checkallEl);
		
		/*
		// Archive Case
		this.archiveAlert = $('<div>').btn({ icon: 'archive', text: 'Archive Alerts', callback: function () {
			
		}});
		this.panelSubBar.append(this.archiveAlert);
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Snooze Alerts
		
		this.snoozeAlert = $('<div>').btn({ icon: 'snooze', text: 'Snooze', callback: function () {
			
		}});
		this.panelSubBar.append(this.snoozeAlert);
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Move To
		this.moveTo = $('<div>').btn({ icon: 'moveTo', text: 'Move To', callback: function () {
			
		}});
		this.panelSubBar.append(this.moveTo);
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		*/

		
		// Case information block
		// this.infoBlock = $('<div>').infoblock();
		// this.container.append(this.infoBlock);
		// Create List
		
		this.list = $('<div>').addClass('tele-case-alerts-block');
		this.listWrap = $('<div>').addClass('tele-wrapper').append(this.list).css({ display: 'inline-block', float:'left' }).width('65%');

		this.container.append(this.listWrap);
		
		// Init List
		this.list.teleList({ 
			data: this.data.items,
			//height: 500,
			formatter: function(row) {
				return that.formatter(row);
			},

			callbacks: {

				scroll: function (offset, callback) {
					telepath.ds.get('/cases/get_case_sessions', {
						sort: that.sort,
						dir: that.dir,
						cid : that.caseID,
						displayed: that.displayed
					}, function (data) {
						data.items.items.map(function (a) {
							that.displayed.push(a.sid)
						});
						if(typeof(callback) == 'function') {
							callback(data);
						}
					}, false, false, true);
				}
			}
		});

		this.list.mCustomScrollbar('update')

		this.similarsList=$('<div>').addClass('tele-case-similar-block');
		this.similarsListWrap = $('<div>').addClass('tele-wrapper').append(this.similarsList).css({ display: 'inline-block', float:'left'  }).width('35%');

		this.container.append(this.similarsListWrap);

		// Init List
		if (this.data.similars){

			this.similarsList.teleList({
				title: 'Related Sessions',
				//height: 500,
				data: this.data.similars.items,
				formatter: function(row) {
					return that.formatter(row);
				}
			});
		}

		$(window).resize(function () { that._resize() });


		//$(window).trigger('resize');


		//$(this.listWrap).mCustomScrollbar({ advanced:{ updateOnContentResize: true } });
		//$(this.similarsListWrap).mCustomScrollbar({ advanced:{ updateOnContentResize: true } });

	},
	formatter: function(item) {
		
		var that = this;
		
		var result = {};
		
		result.title = item.title != '' ? item.title : item.display_path;
		result.progbar = true;
		result.time    = item.date;
		result.timeFormat = 'h:i A';
		result.offset = 20;
		result.icon   = 'case';
		result.count   = item.count;
		result.itemID = item.sid;
		
		result.details = [
			{ key: 'country', value: item.country },
			{ key: 'IP', value: item.ip_orig },
			{ key: 'city', value: item.city },
			{ key: 'user', value: item.user_id },
			{ key: 'host', value: grabNames(item.host) },
			{ key: 'alerts', value: item.alerts_count },
			{ key: 'actions', value: item.actions_count },
			{ key: 'user', value: item.user }
		];
		
		result.raw = item;
		
		var alert = item.alert_count > 0;
		
		result.progbarValue = parseInt(item.score);
		
		if(alert !== false) {
			result.icon   = 'alert';
			result.description  = alert.name;
			result.progbarValue = alert.numeric_score;
		} else {
			if(item.avg_score > 85) {
				result.icon = 'suspect_red';
			}
		}

		return result;
	
	},
	_resize: function () {
		var height = $(window).height();
		$('.tele-body').css({ height: height });
		var offset = height -
			$('.tele-header').outerHeight() -
			$('.tele-panel-topbar').outerHeight() -
			$('.tele-case-graph').outerHeight() -
			$('.tele-panel-subtitle').outerHeight();

		$('.tele-panel-case .tele-block').height(offset - 40);
		$('.tele-panel-case .tele-block .tele-list').height(offset - 70);
		$('.tele-panel-case .tele-case-alerts-block .tele-list').mCustomScrollbar("update");
		$('.tele-panel-case .tele-case-similar-block .tele-list').mCustomScrollbar("update");

	}
	
}
