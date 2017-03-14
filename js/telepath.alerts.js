telepath.alerts = {
	
	sort: 'date',
	dir: false,
	data: [],
	searchString: '',
	firstSearchString: '',
	alertsFilter: [],
	actionsFilter: [],
	actionsFilterSessions: [],
	allAlerts: true, // indicate if all the data is shown, without alert filter
	allActions: true, // indicate if all the data is shown, without action filter
	loading: 0,
	displayed: [],
	init: function () {
		
		var that = this;
		
		// Add Common HTML
		var container = $('.tele-panel-alerts');
		container.empty();

		var panelTopBar = $('<div>').addClass('tele-panel-topbar');
		var panelSubBar = $('<div>').addClass('tele-panel-subtitle');
		var panelTitle  = $('<div>').addClass('tele-panel-title');
		var panelTopBarRight = $('<div>').addClass('tele-panel-topbar-right');
		
		panelTopBar.append(panelTitle).append(panelTopBarRight);
		
		panelTitle.html('Loading Alerts');
		
		this.panelTitle = panelTitle;
		
		container.append(panelTopBar).append(panelSubBar)/*.append(telepath.loader);*/

		// Select all cases
/*		var checkallEl = $('<a>').teleCheckbox({ callback: function (e) {
			$('.tele-panel-alerts .tele-list li.tele-listitem').listitem("option", "checked", e.options.checked);
		}});
		panelSubBar.append(checkallEl);
		
		// Archive cases
		var archiveBtn = $('<div>').btn({ icon: 'archive', text: 'Archive Alerts', callback: function () { console.log('Archive'); }});
		panelSubBar.append(archiveBtn);
		
		panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Delete cases
		var deleteBtn = $('<div>').btn({ icon: 'delete', text: 'Delete', callback: function () { console.log('Archive'); }});
		panelSubBar.append(deleteBtn);
		
		panelSubBar.append('<div class="tele-navsep"></div>'); // Sep*/
		
		// Sort filters
		var sortRadios = $('<div>').radios({ 
			title: 'Sort By', 
			items: [
				{id: 'date', icon: 'time', tip: 'Time', dir: that.dir},
				//{id: 'name', icon: 'arrow', tip: 'ABC'},
				{id: 'count', icon: 'bars', tip: 'Count', dir: that.dir},
				//{id: 'score', icon: 'alerts', tip: 'Score'}
			],
			selected: this.sort,
			callback: function(e, id) {
				if (that.loading){
					return
				}
				that.loading=true;
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
		
		// Search
        var searchAlerts = $('<div>').teleSearch({
            callback: function (e, txt) {
                // Search
                telepath.alerts.searchString = txt;
                telepath.alerts.refresh();

            }, rewrite: true
        });

		// On Dashboard map call, we need to display the alerts with country filter
		if (this.firstSearchString) {
			this.searchString = this.firstSearchString;
			searchAlerts.children().val(this.searchString);
			this.firstSearchString = '';
		}
		else {
			this.searchString = '';
		}

		panelSubBar.append(searchAlerts);
		// Top bar items
		// --------------------------------------
		
		var container = $('.tele-panel-alerts .tele-panel-topbar-right');
		
		container.empty();
		
		// DateRange
		var filterDateRange 	  = $('<div>').daterange({ 
			
			start: telepath.range.start, 
			end: telepath.range.end, 
			change: function(start, end) { 
			
			telepath.range.start = start;
			telepath.range.end = end;
			
			telepath.alerts.hardRefresh();
			
		}});
		
		// Applications
		var filterApps		     = $('<div>').appSelect({ callback: function (app_id) {
			$('.tele-icon-application', filterApps).removeClass('tele-icon-application').addClass('tele-icon-loader');
			telepath.alerts.hardRefresh(function () {
				$('.tele-icon-loader', filterApps).removeClass('tele-icon-loader').addClass('tele-icon-application');
			});
		}});

		// Refresh
		var cmdRefresh = $('<div>').addClass('tele-refresh');
		var cmdRefreshButton = $('<a>').addClass('tele-refresh-button').html('&nbsp;');
		cmdRefresh.append(cmdRefreshButton);

		cmdRefreshButton.click(function () {
			if (!telepath.alerts.loading) {
				var that = this;
				telepath.alerts.hardRefresh();
			}
		});

		//Clear filters
		var clearFilters = $('<div>').addClass('tele-clear');
		var clearFiltersButton = $('<a>').addClass('tele-clear-button').html('Clear Filters').click(function(){
			if (!telepath.alerts.loading) {
				that.resetFilters();
			}
		});

		clearFilters.append(clearFiltersButton);

		// Append All
		container.append(clearFilters).append('<div class="tele-navsep"></div>').append(sortRadios)
			.append('<div class="tele-navsep"></div>').append(filterDateRange)
			.append('<div class="tele-navsep"></div>').append(filterApps)
			.append('<div class="tele-navsep"></div>').append(cmdRefresh);
		
        that.refresh()
	},

	refresh: function (callback) {

		var that = this;

		// If the user changed the search input without search clicking or changed to empty input
		this.searchString = $('.tele-panel-subtitle .tele-search-input').val();

		var container = $('.tele-panel-alerts');
		// Empty panet
		$('.tele-alerts-block, .tele-alert-graphs-block, .tele-loader', container).remove();

		// Create List container
		var list = $('<div>').addClass('tele-alerts-block').css('height', '1px');
		// Create Graphs Block container
		var graphsBlock = $('<div class="tele-alert-graphs-block">').css({marginTop: 20});
		container.append(list).append(graphsBlock);
		// Add loaders
		list.append(telepath.loader);
		graphsBlock.append(telepath.loader);

		// Rebind to define the size of the list and graph containers
		$(window).unbind('resize', this._resize);
		$(window).bind('resize', this._resize);
		// Call Once
		$(window).trigger('resize');

		this.loading = 2;
		$('.tele-panel-alerts .tele-panel-topbar-right').addClass('wait');

		if(this.actionsFilter.length){
			telepath.ds.get('/alerts/get_action_filter_sessions', {
				actionsFilter: that.actionsFilter
			}, function (data) {

				telepath.alerts.actionsFilterSessions = data.items.action_filter_sessions;
				that.refreshSession(callback);
				that.refreshGraphs(callback);
				if (callback && typeof(callback) == 'function') {
					callback();
				}
			}, false, false, true);
		}
		else{
			this.refreshSession(callback);
			this.refreshGraphs(callback);
		}
	},

	refreshSession: function (callback) {

		var that = this;

		this.displayed = [];

		telepath.ds.get('/alerts/get_alerts', {
			sort: this.sort,
			dir: this.dir,
			search: this.searchString,
			alertsFilter: that.alertsFilter,
			actionsFilterSessions: that.actionsFilterSessions
		}, function (data) {

			that.loading--;
			if(!that.loading){
				$('.tele-panel-alerts .tele-panel-topbar-right').removeClass('wait');
			}

			if (typeof (data.items) != 'undefined') {
				data.items.alerts.items.map(function (a) {
					that.displayed.push(a.sid)
				});
			}
			telepath.alerts.setSessionData(data.items);
			if (callback && typeof(callback) == 'function') {
				callback();
			}
		}, false, false, true);

	},
	refreshGraphs: function (callback) {

		var that = this;

		// Time chart and Alert filter
		telepath.ds.get('/alerts/get_charts', {
			search: this.searchString,
			alertsFilter: that.alertsFilter,
			actionsFilterSessions: that.actionsFilterSessions
		}, function (data) {

			that.loading--;
			if(!that.loading){
				$('.tele-panel-alerts .tele-panel-topbar-right').removeClass('wait');
			}

			telepath.alerts.setGraphData(data.items);
			if (callback && typeof(callback) == 'function') {
				callback();
			}
		}, false, false, true);

	},
	hardRefresh: function(callback){
		deleteCache('telecache');
		this.refresh(callback);
	},
	setSessionData: function(data) {
		
		// Set
		telepath.alerts.data.alerts = data.alerts;
		
		// Container
		var that = this;
		var container = $('.tele-panel-alerts');
		this.container = container;
		
		// List
		this.list = $('.tele-alerts-block');

		// Cleanup
		$('.tele-loader', this.list).remove();

        if(!data.alerts.items.length) {
            this.panelTitle.html('No Data');
            return;
        }

		// Init List
		this.list.teleList({ 
		data: this.data.alerts.items,
		searchkey: telepath.alerts.searchString,
		formatter: function(item) {
			
		//	item.checkable = true;
			return telepath.alert.rowFormatter(item);
			
		},
		callbacks: { scroll: function (offset, callback) {

				telepath.ds.get('/alerts/get_alerts', {
					sort: telepath.alerts.sort,
					dir: telepath.alerts.dir,
					search: telepath.alerts.searchString,
					alertsFilter: that.alertsFilter,
					actionsFilterSessions: that.actionsFilterSessions,
					displayed: that.displayed
				}, function (data) {
					if (typeof (data.items) != 'undefined') {
						data.items.alerts.items.map(function (a) {
							that.displayed.push(a.sid)
						});
					}
					callback(data.items.alerts);
				}, false, false, true);
				
			}
		}
		
		});

		// Update title + Create Add Button
		this.panelTitle.html( thousandsFormat(data.alerts.count) + ' Sessions');
		
		if(parseInt(data.alerts.count) == 0) {
			//return;
		}

		
		// Rebind
		$(window).unbind('resize', that._resize);
		$(window).bind('resize', that._resize);
		// Call Once
		
		$(window).trigger('resize');
		
	},
	setGraphData: function(data){

		telepath.alerts.data.distribution_chart = data.distribution_chart;
		telepath.alerts.data.time_chart = data.time_chart;

		// Container
		var that = this;
		var container = $('.tele-panel-alerts');
		this.container = container;

		// Graphs Block
		var graphsBlock = $(".tele-alert-graphs-block");

		// Cleanup
		$('.tele-loader', graphsBlock).remove();

        if (!data.distribution_chart.length) {
            return;
        }

		var graphOverTimeContainer = $('<div>').addClass('tele-alert-graph-overtime');
		var graphOverTimeTitle 	   = $('<h2>').html('Alerts over time');
		var graphOverTimeCanvas    = $('<div>').addClass('tele-alert-graph-overtime-canvas');

		graphOverTimeContainer.append(graphOverTimeTitle).append(graphOverTimeCanvas);

		var graphDistributionContainer = $('<div>').addClass('tele-alert-graph-distribution');
		var graphDistributionTitle 	   = $('<h2>').html('Total Events');
		this.graphDistributionCanvas    = $('<div>').addClass('tele-alert-graph-distribution-canvas');
		var showPercent    = $('<div>').attr('id','alert-distribution-showPercent');
		var graphDistributionLegend    = $('<div>').attr('id','alert-distribution-legend');



		var newToggle = $('<div>').toggleFlip({ left_value: 'Alerts', right_value: 'Business Actions', flip: function (x) {

			if(!x) {
				$("#alert-distribution-showPercent").empty();
				that.alertsFilterDisplayed = true;
				that.show_alert_distribution();
			} else {
				$("#alert-distribution-showPercent").empty();
				that.alertsFilterDisplayed = false;

				// BA filter data
				that.graphDistributionCanvas.empty().append(telepath.loader);

				// empty BA filter data
				telepath.alerts.data.action_distribution_chart = false;
				telepath.ds.get('/alerts/get_action_distribution_chart', {
					search: this.searchString,
					alertsFilter: that.alertsFilter,
					actionsFilter: that.actionsFilter
				}, function (data) {
					// set data
					telepath.alerts.data.action_distribution_chart = data.items.action_distribution_chart;
					that.show_action_distribution();
				}, false, false, true);
			}

		} });

		/*var reset = $('<a>').attr('href', '#').addClass('reset-button').click(function (){
			console.log('came here');
			that.resetFilters();
		});*/

		graphDistributionContainer.append(graphDistributionTitle).append(newToggle)/*.append(reset)*/.append(showPercent)
			.append(graphDistributionLegend).append(this.graphDistributionCanvas);

		// Add the 2 graph containers
		graphsBlock.append(graphOverTimeContainer).append(graphDistributionContainer);

            // Graph
            var options = {

			legend: { show: false },
			series: { lines: { show: true, fill: true }, points: { show: true, fillColor: '#fff' } },
			yaxis: { ticks: 5, color: '#D6D6D6', font: { color: '#cccccc', size: 11, weight: "bold" } },
			selection: { mode: "x" },
			xaxis: { font: { color: '#cccccc', size: 11, weight: "bold" }, mode: 'time', timezone: "browser", timeformat: "%d/%m/%y" },
			grid: { borderColor: '#D6D6D6', borderWidth: 0, clickable: true, hoverable: true, autoHighlight: true },
			tooltip:true,
			tooltipOpts:{
				content: "date: %x | alerts: %y"
				// "%s | date: %x | alerts: %y"
			}
		};

		// $('.graph').on('plothover', function ( event, pos, item ) {
		//     if ( hoverTip )
		// 	    hoverTip.remove();

		//     if (item) {

            // 	      hoverTip = $(toolTipHTML( item.series.data[item.dataIndex][1], item.series.label ));
            // 	      $('.graph').parent().append(hoverTip);
            // 	      ofsh = hoverTip.outerHeight();
            // 	      ofsw = hoverTip.outerWidth();
            // 	      hoverTip.offset({
            // 	            left: item.pageX - ofsw / 2,
            // 	            top: item.pageY - ofsh - 15
            // 	         });
            // 	   }
            // };

            // $('.graph').on('plotclick', function ( event, pos, item ) {
            //     ...
            // };

            // Generate sample data
            var chart_data = [{label: "random", data: this.data.time_chart, color: '#FC3D3D'}];
            graphOverTimeCanvas.flotGraph({data: chart_data, options: options});

		// Sample data
		telepath.alerts.show_alert_distribution();
		that.alertsFilterDisplayed = true;

		// Init Scroll

		$(graphsBlock).mCustomScrollbar({
			advanced:{ updateOnContentResize:true },
			scrollButtons:{	enable: false },
			scrollInertia: telepath.scrollSpeed
		});
		// Rebind
		$(window).unbind('resize', that._resize);
		$(window).bind('resize', that._resize);
		// Call Once

		$(window).trigger('resize');
	},
	show_alert_distribution: function() {
		
		var that = this;

		this.graphDistributionCanvas.empty();
		
		var pie_data = this.data.distribution_chart;
	
		// Calculate total for percentage
		var dataTotal = 0;
		$.each(pie_data, function(i, row) {
			dataTotal += parseInt(row.data);
		});
				
		var options = {
			series: {
				pie: {
					show: true,
					radius: 0.5,
					innerRadius: 0.4,
					margin: 100,
					label: {
						show: false,
						radius: 0.3,
						formatter: function(lbl, obj) { 
							
							var count   = parseInt(obj.data[0][1]);
							var percent = parseInt(count / dataTotal * 100) + '%';
							
							var pieTemp    = $('<div>');
							var pieLabel   = $('<div>').addClass('tele-pie-label').html(lbl);
							var piePercent = $('<div>').addClass('tele-pie-percent').html(percent).css('color', obj.color);
							var pieCount   = $('<div>').addClass('tele-pie-count').html(count + ' alerts');
							
							pieTemp.append(pieLabel).append(piePercent).append(pieCount);

							return pieTemp.html(); 
							
						}
					}
				}
			},
			grid:{
				hoverable: true,
				clickable: true
			},
			legend: { 
				show: true,
				position: "nw",
				margin: ([50,100]),
				sorted:"ascending",
				/*labelFormatter: function(label, series) {
					//return '<span style="cursor:pointer">' + label + '</span>';
					return label
				}*/
				//container: $("#alert-distribution-legend")
			},
			// tooltip: true,
		};

		if (window.innerWidth < 1200){
			options.series.pie.margin=0;
			options.legend.margin=([50,300]);
		}

		function pieHover(event, pos, obj) 
		{
			if (!obj)
		    	return;
			percent = parseFloat(obj.series.percent).toFixed(2);
			$("#alert-distribution-showPercent").html('<span style="font-weight: bold; color: '+obj.series.color+'">'+obj.series.label+' ('+percent+'%)</span>');
			$('.tele-graph-canvas .flot-overlay').css({"cursor": "pointer"})
		}

		function pieClick(event, pos, obj){

			if (!obj)
				return;
			if (obj.series.label ){
				that.alertsFilter=[];
				that.alertsFilter.push(obj.series.label);
				// if there is only one alert, we don't change the allAlerts variable
				if (that.data.distribution_chart.length != that.alertsFilter.length) {
					that.allAlerts = false;
				}
			}
			that.refresh()

		}

		function legendClick(){
			$('.legend tr').on('click',function(){
				// fill the alertsFilter array
				if(that.allAlerts){
					that.alertsFilter = [];
					$.each(that.data.distribution_chart, function(i, val){
						that.alertsFilter.push(val.label);
					})
				}

				var item = $(this).children('.legendLabel').text();
				if (($.inArray(item , that.alertsFilter)!=-1)){
					that.alertsFilter.splice( $.inArray(item, that.alertsFilter), 1 );
					that.allAlerts = false;
				} else {
					that.alertsFilter.push(item);
					// the alert filter need to correspond to the current data (needed if the user has changed date
					// range or app filter)
					that.alertsFilter = $.grep(that.alertsFilter, function (n, i) {
						var item = $.grep(that.data.distribution_chart, function (item) {
							return item.label == n;
						});
						return item.length > 0;
					});
					// set the allAlerts variable to true if all the alerts are shown
					if (that.data.distribution_chart.length == that.alertsFilter.length) {
						that.allAlerts = true;
					}
				}
				that.refresh()

			});
		}


		function set_legend(){

			$('.legend tr').css({"cursor":"pointer"});
			if (that.alertsFilter.length>0 && that.allAlerts == false ){
				$.each($('.legend tr'),function (i, val){
					if ($.inArray(val.children[1].innerHTML, that.alertsFilter) == -1) {
						$( this).children(".legendColorBox").children().html('<div style="width:4px;height:0;border:5px solid #999;overflow:hidden; "></div>');
						$( this ).css({"opacity": "0.5"});
					}
				})
			}
		}
		
		// Plot Graph
		setTimeout(function () {
		
			telepath.alerts.graphDistributionCanvas.flotGraph({ data: pie_data, options: options });
			$(".tele-alert-graph-distribution-canvas .tele-graph-canvas").bind('plothover', pieHover);
			$(".tele-alert-graph-distribution-canvas .tele-graph-canvas").bind('plotclick', pieClick);
			legendClick();
			set_legend();
			that._resize();
		}, 100);
		
	},


	show_action_distribution: function() {

		var that = this;
	
		this.graphDistributionCanvas.empty();
		
		var pie_data = this.data.action_distribution_chart;

		if (!pie_data){
			this.graphDistributionCanvas.append(telepath.loader);
			return;
		}
	
		// Calculate total for percentage
		var dataTotal = 0;
		$.each(pie_data, function(i, row) {
			dataTotal += parseInt(row.data);
		});
				
		var options = {
			series: {
				pie: {
					show: true,
					radius: 0.5,
					innerRadius: 0.4,
					margin: 100,
					label: {
						show: false,
						radius: 0.3,
						formatter: function(lbl, obj) { 
							
							var count   = parseInt(obj.data[0][1]);
							var percent = parseInt(count / dataTotal * 100) + '%';
							
							var pieTemp    = $('<div>');
							var pieLabel   = $('<div>').addClass('tele-pie-label').html(lbl);
							var piePercent = $('<div>').addClass('tele-pie-percent').html(percent).css('color', obj.color);
							var pieCount   = $('<div>').addClass('tele-pie-count').html(count + ' alerts');
							
							pieTemp.append(pieLabel).append(piePercent).append(pieCount);

							return pieTemp.html(); 
							
						}
					}
				}
			},
			grid:{
				hoverable: true,
				clickable: false
			},
			legend: { 
				show: true,
				position: "nw",
				margin: ([50,100]),
				sorted:"ascending",
				//container: $("#alert-distribution-legend")
			},
			// tooltip: true,
		};

		if (window.innerWidth < 1200){
			options.series.pie.margin = 0;
			options.legend.margin = ([50, 300]);
		}

		function pieHover(event, pos, obj) 
		{
			if (!obj)
		    	return;
			percent = parseFloat(obj.series.percent).toFixed(2);
			$("#alert-distribution-showPercent").html('<span style="font-weight: bold; color: '+obj.series.color+'">'+obj.series.label+' ('+percent+'%)</span>');
			//$('.tele-graph-canvas .flot-overlay').css({"cursor": "pointer"})
		}
		function pieClick(event, pos, obj){

			/*if (!obj)
				return;
			if (obj.series.label ){
				if (that.actionsFilter.length == 1 && obj.series.label == that.actionsFilter[0]){
					that.actionsFilter = [];
					that.allActions = true;
				}
				else {
					that.actionsFilter = [];
					that.actionsFilter.push(obj.series.label);
					// if there is only one alert, we don't change the allAlerts variable
					if (that.data.action_distribution_chart.length != that.actionsFilter.length) {
						that.allActions = false;
					}
				}

			}
			that.refresh()*/

		}


		function legendClick(){
			/*$('.legend tr').on('click',function(){
				// fill the filter array
				if(that.allActions){
					that.actionsFilter = [];
					$.each(that.data.action_distribution_chart, function(i, val){
						that.actionsFilter.push(val.label);
					})
				}

				var item = $(this).children('.legendLabel').text();
				if (($.inArray(item, that.actionsFilter) != -1)) {
					that.actionsFilter.splice($.inArray(item, that.actionsFilter), 1);
					that.allActions = false;
				} else {
					that.actionsFilter.push(item);
					// the alert filter need to correspond to the current data (needed if the user has changed date
					// range or app filter)
					that.actionsFilter = $.grep(that.actionsFilter, function (n, i) {
						var item = $.grep(that.data.action_distribution_chart, function (item) {
							return item.label == n;
						});
						return item.length > 0;
					});
					// set the allActions variable to true if all the alerts are shown
					if (that.data.action_distribution_chart.length == that.actionsFilter.length) {
						that.actionsFilter = [];
						that.allActions = true;
					}
				}
				that.refresh()

			});*/
		}

		function set_legend(){

			//$('.legend tr').css({"cursor":"pointer"});
			if (that.actionsFilter.length>0 && that.allActions == false ){
				$.each($('.legend tr'),function (i, val){
					if ($.inArray(val.children[1].innerText , that.actionsFilter)==-1){
						$( this).children(".legendColorBox").children().html('<div style="width:4px;height:0;border:5px solid #999;overflow:hidden; "></div>');
						$( this ).css({"opacity": "0.5"});
					}
				})
			}

		}

		// Plot Graph
		setTimeout(function () {

			telepath.alerts.graphDistributionCanvas.flotGraph({ data: pie_data, options: options });
			$(".tele-alert-graph-distribution-canvas .tele-graph-canvas").bind('plothover', pieHover);
			$(".tele-alert-graph-distribution-canvas .tele-graph-canvas").bind('plotclick', pieClick);
			legendClick();
			set_legend();
			that._resize();
		}, 100);


	},
	resetFilters: function () {
		this.alertsFilter = [];
		this.actionsFilter = [];
		this.actionsFilterSessions = [];
		this.allAlerts = true;
		$('.tele-panel-alerts .tele-search-input').val('');
		telepath.alerts.searchString = '';
		//clear filters button call to server side only if there are applications in application filter
		if (telepath.app_filter.length){
			$('.tele-dropdown').data('teleAppSelect').resetApps()
		}
		else {
			this.refresh();
		}
	},
	_resize: function () {

		var that = this;
		
		if($('.tele-panel-alerts').children().size() == 0) return;
		
		var height = $(window).height();
		var width  = window.innerWidth;
		
		$('.tele-body').css({ height: height });
		var offset = height - 
					 $('.tele-header').outerHeight() - 
					 $('.tele-panel-topbar').outerHeight() - 
					 $('.tele-panel-subtitle').outerHeight();
		
		var magic = 500;
		
		if(width < 1200) {
			
			if(width < 1024) {
			
				magic = 300;
			
			} else {
				
				magic = 400;
			
			}
	
		} else {
			
			magic = 600;
		
		}

		$('.tele-panel-alerts .tele-alert-graphs-block', this.list).width(magic );
		$('.tele-panel-alerts .tele-alerts-block').width(width - magic - 25);
		$('.tele-panel-alerts .tele-block .tele-list').width(width - magic - 40).height(offset - 50).mCustomScrollbar("update");
		$('.tele-panel-alerts .tele-alert-graphs-block').height(offset - 50).mCustomScrollbar("update");

		if (window.innerWidth <1200 ){

			this.graph = $('.tele-alert-graph-distribution-canvas.tele-graph');
			this.legendHeight=$('.legend table').height();
			this.pieGraphHeight=$('.tele-alert-graph-distribution-canvas.tele-graph .tele-graph-canvas-outer').height();
			this.graph.height(that.pieGraphHeight + that.legendHeight);
			
		}

	}
}
