telepath.suspects = {
	
	sort: 'time',
	dir: false,
	data: [],
	total: 0,
	searchString: '',
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
			
				telepath.suspects.refresh(function () {	});
			
		}});
		
		// Applications
		var filterApps		     = $('<div>').appSelect({ callback: function (app_id) {
			$('.tele-icon-application', filterApps).removeClass('tele-icon-application').addClass('tele-icon-loader');
			telepath.suspects.refresh(function () {
				$('.tele-icon-loader', filterApps).removeClass('tele-icon-loader').addClass('tele-icon-application');
			});
		}});
		
		// Append tools
		this.panelTopBarRight.append(filterDateRange).append('<div class="tele-navsep"></div>').append(filterApps);
		
		// Sub bar items
		// --------------------------------------
		
		// Select all cases
		var checkallEl = $('<a>').teleCheckbox({ callback: function (e) {
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
		
		this.panelSubBar.append('<div class="tele-navsep"></div>'); // Sep

		// Sort filters
		var sortRadios = $('<div>').radios({ 
			title: 'Sort By', 
			items: [ 
				{ id: 'date'     , icon: 'time', tip: 'Time' }, 
				{ id: 'score'    , icon: 'bars', tip: 'Severity' }, 
				{ id: 'alerts'   , icon: 'alerts', tip: 'Alerts' }
			], 
			selected: this.sort,
			callback: function(e, id) {
				if(that.sort == id) {
					that.dir = !that.dir;
				}
				that.sort = id;
				that.refresh();
			}
		});
		this.panelSubBar.append(sortRadios);
		
		// Search
		var searchSuspects = $('<div>').teleSearch({ callback: function (e, txt) {
			telepath.suspects.searchString = txt;
			telepath.suspects.refresh(function () {	});
		}});
		this.panelSubBar.append(searchSuspects);

		if (telepath.suspects.searchString)
		{
			$('.tele-panel-suspects .tele-search-input').val(telepath.suspects.searchString);
		}
		
		// Load Data
		this.refresh();
		
		
	},
	refresh: function (callback) {
		
		$('.tele-block, .tele-loader', this.container).remove();
		this.container.append(telepath.loader);
		
		var that = this;
		
		telepath.ds.get('/suspects/index', {
			sort: this.sort,
			dir: this.dir,
			search: this.searchString
		}, function (data) {
			
			that.count = data.count;
			that.data  = data.items;
			
			telepath.suspects.loadData();
			
			if(typeof(callback) == 'function') {
				callback();
			}
			
		});
		
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
		this.suspectsList.teleList({ context: "panel", data: this.data, searchkey: telepath.suspects.searchString, callbacks: { scroll: function (offset, callback) {
		
				telepath.ds.get('/suspects/index', {
					sort:   telepath.suspects.sort,
					dir:    telepath.suspects.dir,
					search: telepath.suspects.searchString,
					offset: offset,
					}, function (data) {
						callback(data);
				});
			}
		} });
		
		this.panelTitle.html('Active Suspicions | ' + this.count + ' Sessions');
		
		// Resize hooks
		setTimeout(function () { that._resize(); }, 0);
		$(window).resize(function () { that._resize() });
		
	}
}
