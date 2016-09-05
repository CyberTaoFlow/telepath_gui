telepath.alerts = {
	
	sort: 'date',
	dir: false,
	data: [],
	searchString: '',
	filter: [],
	allData: true, // indicate if all the data is shown, without alert filter
	loading: false,
	displayed: [],
	displayed_ips: [],
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
		var searchAlerts = $('<div>').teleSearch({ callback: function (e, txt) {
			// Search
			telepath.alerts.searchString = txt;
			//telepath.alerts.refresh();
			
		}});

		// reset button in search input
		var resetInput=$('<a>').addClass('icon-delete-input2').attr('id', 'remove-button').click(function(){
			$('.tele-panel-alerts .tele-search-input').val('');
			telepath.alerts.searchString = '';
			telepath.alerts.refresh();
		});

		//searchAlerts.append(resetInput);

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
		var cmdRefreshButton = $('<a>').attr('href', '#').addClass('tele-refresh-button').html('&nbsp;');
		cmdRefresh.append(cmdRefreshButton);

		cmdRefreshButton.click(function () {
			if (!telepath.alerts.loading) {
				var that = this;
				telepath.alerts.hardRefresh();
			}
		});
		
		// Append All
		container.append(sortRadios).append('<div class="tele-navsep"></div>').append(filterDateRange)
			.append('<div class="tele-navsep"></div>').append(filterApps).append('<div class="tele-navsep"></div>').append(cmdRefresh);
		

		/*var typingTimer;                //timer identifier
		var doneTypingInterval = 1000;

		$('.tele-panel-alerts .tele-search-input').keyup('input', function () {
			clearTimeout(typingTimer);
			if ($('.tele-panel-alerts .tele-search-input').val()){
				typingTimer = setTimeout(function(){
					telepath.alerts.searchString = $('.tele-panel-alerts .tele-search-input').val();
					that.input();
				}, doneTypingInterval);
			}
		});*/

		$(".tele-search").on("click",'.icon-delete-input2', function (event) {
			clearTimeout(typingTimer);
			that.searchString = '';
			$(".tele-panel-alerts .tele-search-input").prop("value", telepath.alerts.searchString);
			that.input();
		});

		// insert the value search to the input box (Moshe)
		if (telepath.alerts.searchString) {
			$('.tele-panel-alerts .tele-search-input').prop("value", telepath.alerts.searchString);
			that.input();
		}
		else {
			telepath.alerts.refresh();
		}
	},

	input: function(){
		var that = this;
		var icon= $("#search-button");
		if (telepath.alerts.searchString.length>0)
			icon.addClass('icon-delete-input2').removeClass("tele-search-button");
		else
			icon.removeClass('icon-delete-input2').addClass("tele-search-button");

		that.refresh()

	},

	refresh: function (callback) {

		var that = this;

		var container = $('.tele-panel-alerts');
		$('.tele-alerts-block, .tele-alert-graphs-block, .tele-loader', container).remove();

		this.displayed = [];
		this.displayed_ips = [];
		container.append(telepath.loader);

			telepath.ds.get('/alerts/index', {
			sort: this.sort,
			dir: this.dir,
			search: this.searchString,
			filters: this.filter
			}, function (data) {

				if (typeof (data.items) != 'undefined') {
					data.items.alerts.items.map(function (a) {
						that.displayed.push(a.sid)
					});
				}
				if (typeof (data.items.alerts.displayed_ips) != 'undefined') {
					that.displayed_ips = data.items.alerts.displayed_ips;
				}
			telepath.alerts.loading=false;
			telepath.alerts.setData(data.items);
			if(callback && typeof(callback) == 'function') {
				callback();
			}
		}, false, false, true);

	},
	hardRefresh: function(callback){
		deleteCache('telecache');
		this.refresh(callback);
	},
	setData: function(data) {
		
		// Set
		telepath.alerts.data = data;
		
		// Container
		var that = this;
		var container = $('.tele-panel-alerts');
		this.container = container;
		
		// Cleanup
		$('.tele-alerts-block, .tele-alert-graphs-block, .tele-loader', container).remove();
		
		// Sanity
		
		if(data.alerts.total == 0) {
			this.panelTitle.html('No Data');
			return;
		}
		
		// Create List
		this.list = $('<div>').addClass('tele-alerts-block');
		this.container.append(this.list);
		
		// Init List
		this.list.teleList({ 
		data: this.data.alerts.items,
		searchkey: telepath.alerts.searchString,
		formatter: function(item) {
			
		//	item.checkable = true;
			return telepath.alert.rowFormatter(item);
			
		},
		callbacks: { scroll: function (offset, callback) {

				telepath.ds.get('/alerts/index', {
					sort: telepath.alerts.sort,
					dir: telepath.alerts.dir,
					search: telepath.alerts.searchString,
					offset: offset,
					filters: that.filter,
					displayed: that.displayed,
					displayed_ips: that.displayed_ips
				}, function (data) {
					if (typeof (data.items) != 'undefined') {
						data.items.map(function (a) {
							that.displayed.push(a.sid)
						});
						if (typeof (data.displayed_ips) != 'undefined') {
							that.displayed_ips = data.displayed_ips;
						}
					}
					callback(data);
				}, false, false, true);
				
			}
		}
		
		});

		// Update title + Create Add Button
		this.panelTitle.html( thousandsFormat(data.alerts.count) + ' Sessions');
		
		if(parseInt(data.alerts.count) == 0) {
			return;
		}
		
		// Graphs Block
		var graphsBlock = $('<div class="tele-alert-graphs-block">').css({ marginTop: 20 });
		$(container).append(graphsBlock);

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
				telepath.alerts.show_alert_distribution();			
			} else {
				$("#alert-distribution-showPercent").empty();
				telepath.alerts.show_action_distribution();
			}

		} });
		
		graphDistributionContainer.append(graphDistributionTitle).append(newToggle).append(showPercent).append(graphDistributionLegend).append(this.graphDistributionCanvas);
		
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
		var chart_data = [{ label: "random", data: this.data.time_chart, color: '#FC3D3D' }];
		graphOverTimeCanvas.flotGraph({ data: chart_data, options: options });
		
		// Sample data
		telepath.alerts.show_alert_distribution();
		
		// Init Scroll
		
		$(graphsBlock).mCustomScrollbar({
			advanced:{ updateOnContentResize:true },
			scrollButtons:{	enable: false },
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
			options.series.pie.margin=[50,0];
			options.legend.margin=([50,400])
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
				that.filter=[];
				that.filter.push(obj.series.label);
				// if there is only one alert, we don't change the allData variable
				if (that.data.distribution_chart.length != that.filter.length) {
					that.allData = false;
				}
			}
			that.refresh()

		}

		function legendClick(){
			$('.legend tr').on('click',function(){
				// fill the filter array
				if(that.allData){
					that.filter = [];
					$.each(that.data.distribution_chart, function(i, val){
						that.filter.push(val.label);
					})
				}

				var item = $(this).children('.legendLabel').text();
				if (($.inArray(item , that.filter)!=-1)){
					that.filter.splice( $.inArray(item, that.filter), 1 );
					that.allData = false;
				} else {
					that.filter.push(item);
					// the alert filter need to correspond to the current data (needed if the user has changed date
					// range or app filter)
					that.filter = $.grep(that.filter, function (n, i) {
						var item = $.grep(that.data.distribution_chart, function (item) {
							return item.label == n;
						});
						return item.length > 0;
					});
					// set the allData variable to true if all the alerts are shown
					if (that.data.distribution_chart.length == that.filter.length) {
						that.allData = true;
					}
				}
				that.refresh()

			});
		}


		function set_legend(){

			$('.legend tr').css({"cursor":"pointer"});
			if (that.filter.length>0 && that.allData == false){
				$.each($('.legend tr'),function (i, val){
					if ($.inArray(val.children[1].innerText , that.filter)==-1){
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
			this._resize();
		}, 100);
		
	},


	show_action_distribution: function() {
	
		this.graphDistributionCanvas.empty();
		
		var pie_data = this.data.action_distribution_chart;
	
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
				//container: $("#alert-distribution-legend")
			},
			// tooltip: true,
		};

		if (window.innerWidth < 1200){
			options.series.pie.margin=[50,0];
			options.legend.margin=([50,400])
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
				that.filter=[];
				that.filter.push(obj.series.label)
			}
			that.refresh()

		}

		function legendClick(){
			$('.legend tr').on('click',function(){
				var item = $(this).children('.legendLabel').text();
				if (($.inArray(item , that.filter)!=-1)){
					that.filter.splice( $.inArray(item, that.filter), 1 );
				}else {
					that.filter.push(item)
				}
				that.refresh()

			});
		}


		function set_legend(){

			$('.legend tr').css({"cursor":"pointer"});
			if (that.filter.length>0){
				$.each($('.legend tr'),function (i, val){
					if ($.inArray(val.children[1].innerText , that.filter)==-1){
						$( this).children(".legendColorBox").children().html('<div style="width:4px;height:0;border:5px solid #999;overflow:hidden; "></div>');
						$( this ).css({"opacity": "0.5"});
					}
				})
			}
			else {
				$.each(that.data.distribution_chart, function(i, val){
					that.filter.push(val.label);
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
			this._resize();
		}, 100);

		
	},	
	_resize: function () {

		var that = this;
		
		if($('.tele-panel-alerts').children().size() == 0) return;
		
		var height = $(window).height();
		var width  = $(window).width() - 10;
		
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
		
		$('.tele-panel-alerts .tele-alert-graphs-block', this.list).width(magic);
		$('.tele-panel-alerts .tele-block').width(width - magic - 15);
		$('.tele-panel-alerts .tele-block .tele-list').width(width - magic - 25).height(offset - 50).mCustomScrollbar("update");
		$('.tele-panel-alerts .tele-alert-graphs-block').height(offset - 50).mCustomScrollbar("update");

		if (window.innerWidth <1200 ){

			this.graph = $('.tele-alert-graph-distribution-canvas.tele-graph');
			this.legendHeight=$('.legend table').height();
			this.pieGraphHeight=$('.tele-alert-graph-distribution-canvas.tele-graph .tele-graph-canvas-outer').height();
			this.graph.height(that.pieGraphHeight + that.legendHeight - 50);
			
		}

	}
}
