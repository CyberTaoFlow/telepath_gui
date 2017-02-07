telepath.suspects = {
	
	sort: 'date',
	dir: false,
	data: [],
	total: 0,
	searchString: '',
	loading:false,
	displayed: [],

	rowFormatter: function(item,mode) {

		if (mode=='dashboard') {
			var identification = (item.user!='' ? {key: 'user', value: item.user } : { key: 'IP', value: item.ip_orig } );
			result = {
				raw: item,
				icon: 'suspect',
				time: item.ts,
				progbar: true,
				itemID: item.sid,
				progbarBig: item.progbarBig,
				checkable: item.checkable,
				checked: item.checked,
				count: item.count,
				progbarValue: item.score_average,
				time: item.date,
				state: 'dashboard',
				details: [
					{ key: 'country', value: item.country },
					{ key: 'host', value: grabNames(item.host) },
					identification
				]
			}
		}
		else {
			result = {
				raw: item,
				icon: 'suspect',
				time: item.ts,
				progbar: true,
				itemID: item.sid,
				progbarBig: item.progbarBig,
				checkable: item.checkable,
				checked: item.checked,
				count: item.count,
				progbarValue: item.score_average,
				time: item.date,
				details: [
					{key: 'country', value: item.country},
					{key: 'IP', value: item.ip_orig},
					{key: 'city', value: item.city},
					{key: 'host', value: grabNames(item.host)},
					{key: 'alerts', value: item.alerts_count},
					{key: 'actions', value: item.actions_count},
					{key: 'cases', value: item.cases_count },
					{key: 'user', value: item.user }
				]
			}
		}

		/*if (item.business_action && item.business_action.length>0){
		 result.details.push({key: 'business_actions', value: item.business_actions[0].key})
		 }*/

		return result;
	},
	init: function () {
		
		var that = this;
		
		// Cleanup
		this.container = $('.tele-panel-suspects');
		this.container.empty();
		
		// Build UI
		this.panelTopBar  = $('<div>').addClass('tele-panel-topbar');
		this.panelTitle   = $('<div>').addClass('tele-panel-title');
		this.panelTopBar.append(this.panelTitle);
		this.panelTitle.html('Loading Suspects');
		this.container.append(this.panelTopBar);
		this.panelSubBar = $('<div>').addClass('tele-panel-subtitle');
		this.panelTopBarRight = $('<div>').addClass('tele-panel-topbar-right');
		this.panelTopBar.append(this.panelTopBarRight);
		this.container.append(this.panelSubBar);
		
		// DateRange
		var filterDateRange 	  = $('<div>').daterange({ 
			
			start: telepath.range.start, 
			end: telepath.range.end, 
			change: function(start, end) { 
			
				that.hardRefresh(function () {	});
			
		}});

		// Sort filters
		var sortRadios = $('<div>').radios({
			title: 'Sort By',
			items: [
				{id: 'date', icon: 'time', tip: 'Time', dir: that.dir},
				{id: 'count', icon: 'bars', tip: 'Count', dir: that.dir}
			],
			selected: this.sort,
			callback: function(e, id) {
				if (that.loading){
					return
				}
				that.loading=true;
				that.panelTopBarRight.addClass('wait');

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
		this.panelTopBarRight.append(sortRadios).append('<div class="tele-navsep"></div>');
		
		// Applications
		var filterApps		     = $('<div>').appSelect({ callback: function (app_id) {
			$('.tele-icon-application', filterApps).removeClass('tele-icon-application').addClass('tele-icon-loader');
			that.hardRefresh(function () {
				$('.tele-icon-loader', filterApps).removeClass('tele-icon-loader').addClass('tele-icon-application');
			});
		}});

		// Refresh
		var cmdRefresh = $('<div>').addClass('tele-refresh');
		var cmdRefreshButton = $('<a>').attr('href', '#').addClass('tele-refresh-button').html('&nbsp;');
		cmdRefresh.append(cmdRefreshButton);

		cmdRefreshButton.click(function () {
			if (!telepath.suspects.loading) {
				var that = this;
				telepath.suspects.hardRefresh();
			}
		});
		
		// Append tools
		this.panelTopBarRight.append(filterDateRange).append('<div class="tele-navsep"></div>').append(filterApps).append('<div class="tele-navsep"></div>').append(cmdRefresh);
		
		// Sub bar items
		// --------------------------------------
		
		// Select all cases
/*		var checkallEl = $('<a>').teleCheckbox({ callback: function (e) {
			$('.tele-suspects-alerts .tele-list li.tele-listitem').listitem("option", "checked", e.options.checked);
		}});
		this.panelSubBar.append(checkallEl);

		// Harmful
		var harmfulBtn = $('<div>').btn({ icon: 'harmful', text: 'Mark as Harmful', callback: function () { console.log('HH'); }});
		this.panelSubBar.append(harmfulBtn);
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Safe
		var safeBtn = $('<div>').btn({ icon: 'safe', text: 'Not harmful', callback: function () { console.log('NH'); }});
		this.panelSubBar.append(safeBtn);
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Archive cases
		var archiveBtn = $('<div>').btn({ icon: 'archive', text: 'Archive', callback: function () { console.log('Archive'); }});
		this.panelSubBar.append(archiveBtn);
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep*/

		
		// Search
		var searchSuspects = $('<div>').teleSearch({
			callback: function (e, txt) {
				telepath.suspects.searchString = txt;
				telepath.suspects.refresh();
			}, rewrite: true
		});

		this.searchString = '';



		this.panelSubBar.append(searchSuspects);
		// Load Data
		this.refresh();

	},

	refresh: function (callback) {

		this.displayed =[];
		this.loading = true;

		$('.tele-block, .tele-loader', this.container).remove();
		this.container.append(telepath.loader);
		
		var that = this;
		
		telepath.ds.get('/suspects/index', {
			sort: this.sort,
			dir: this.dir,
			search: this.searchString
		}, function (data) {

			that.loading = false;
			that.panelTopBarRight.removeClass('wait');
			
			if (typeof (data.items.items) != 'undefined') {
				data.items.items.map(function (a) {
					that.displayed.push(a.sid)
				});
			}
			that.count = data.items.count;
			that.data  = data.items.items;
			
			telepath.suspects.loadData();
			
			if(typeof(callback) == 'function') {
				callback();
			}
			
		}, false, false, true);

	},
	hardRefresh: function(callback){
		deleteCache('telecache');
		this.refresh(callback);
	},
	_resize: function () {
		
		if($('.tele-panel-suspects').children().size() == 0) return;
		
		var height = $(window).height();
		
		$('.tele-body').css({ height: height });
		
		var offset = height - 
					 $('.tele-header').outerHeight() - 
					 $('.tele-panel-topbar').outerHeight() - 
					 $('.tele-panel-subtitle').outerHeight();
		
		$('.tele-panel-suspects .tele-block').height(offset - 20);
		$('.tele-panel-suspects .tele-block .tele-list').height(offset - 50);
		$('.tele-list').mCustomScrollbar("update");
		
	},
	loadData: function() {
		
		var that = this;
		
		// Cleanup
		$('.tele-block, .tele-loader', this.container).remove();
		this.suspectsList = $('<div>');
		this.container.append(this.suspectsList);



		// Init Suspects
		this.suspectsList.teleList({ context: "panel", data: this.data, searchkey: telepath.suspects.searchString,
			formatter: function(item) {

			//item.checkable = true;
			return telepath.suspects.rowFormatter(item);

		}, callbacks: { scroll: function (offset, callback) {

				telepath.ds.get('/suspects/index', {
					sort:   telepath.suspects.sort,
					dir:    telepath.suspects.dir,
					search: telepath.suspects.searchString,
					offset: offset,
					displayed: that.displayed
				}, function (data) {

					if (typeof (data.items.items) != 'undefined') {
						data.items.items.map(function (a) {
							that.displayed.push(a.sid)
						});
					}
					that.loading = false;
					that.panelTopBarRight.removeClass('wait');
						callback(data.items);
				}, false, false, true);
			}
		} });
		
		this.panelTitle.html( thousandsFormat(this.count) + ' Sessions');
		
		// Resize hooks
		setTimeout(function () { that._resize(); }, 0);
		$(window).resize(function () { that._resize() });
		
	}
}
