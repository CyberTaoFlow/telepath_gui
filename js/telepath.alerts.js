telepath.alerts = {
	
	sort: 'time',
	dir: false,
	data: [],
	searchString: '',
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
		
		container.append(panelTopBar).append(panelSubBar).append(telepath.loader);

		// Select all cases
		var checkallEl = $('<a>').teleCheckbox({ callback: function (e) {
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
		
		panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Sort filters
		var sortRadios = $('<div>').radios({ 
			title: 'Sort By', 
			items: [ 
				{ id: 'date'          , icon: 'time'  , tip: 'Time' }, 
				{ id: 'counter' , icon: 'bars'        , tip: 'Severity' }, 
				{ id: 'type'          , icon: 'alerts', tip: 'Type' }
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
		panelSubBar.append(sortRadios);
		
		// Search
		var searchAlerts = $('<div>').teleSearch({ callback: function (e, txt) {
			// Search
			telepath.alerts.searchString = txt;
			telepath.alerts.refresh();
			
		}});
		panelSubBar.append(searchAlerts);
		if (telepath.alerts.searchString)
		{
			$('.tele-panel-alerts .tele-search-input').val(telepath.alerts.searchString);
		}

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
			
			telepath.alerts.refresh();
			
		}});
		
		// Applications
		var filterApps		     = $('<div>').appSelect({ callback: function (app_id) {
			$('.tele-icon-application', filterApps).removeClass('tele-icon-application').addClass('tele-icon-loader');
			telepath.alerts.refresh(function () {
				$('.tele-icon-loader', filterApps).removeClass('tele-icon-loader').addClass('tele-icon-application');
			});
		}});
		
		// Append All
		container.append(filterDateRange).append('<div class="tele-navsep"></div>').append(filterApps);
		
		telepath.alerts.refresh();
		
		
	},
	refresh: function (callback) {

		telepath.ds.get('/alerts/index', {
			sort: this.sort,
			dir: this.dir,
			search: this.searchString
		}, function (data) {
			telepath.alerts.setData(data.items);
			if(callback && typeof(callback) == 'function') {
				callback();
			}
		});
		
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
			
			item.checkable = true;
			return telepath.alert.rowFormatter(item);
			
		},
		callbacks: { scroll: function (offset, callback) {

				telepath.ds.get('/alerts/index', {
					sort: telepath.alerts.sort,
					dir: telepath.alerts.dir,
					search: telepath.alerts.searchString,
					offset: offset,
				}, function (data) {
					callback(data);
				});
				
			}
		}
		
		});

		// Update title + Create Add Button
		this.panelTitle.html('Active Alerts | ' + data.alerts.count + ' Alerts');
		
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
		var graphDistributionTitle 	   = $('<h2>').html('Alert distribution');
		this.graphDistributionCanvas    = $('<div>').addClass('tele-alert-graph-distribution-canvas');
		var showPercent    = $('<div>').attr('id','alert-distribution-showPercent');
		var graphDistributionLegend    = $('<div>').attr('id','alert-distribution-legend');
		
		
		var newToggle = $('<div>').toggleFlip({ left_value: 'Type', right_value: 'Business Action', flip: function (x) { 
		
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
			},
			legend: { 
				show: true,
				position: "nw",
				margin: 20,
				sorted:"ascending",
				container: $("#alert-distribution-legend")
			},
			// tooltip: true,
		};

		function pieHover(event, pos, obj) 
		{
			if (!obj)
		    	return;
			percent = parseFloat(obj.series.percent).toFixed(2);
			$("#alert-distribution-showPercent").html('<span style="font-weight: bold; color: '+obj.series.color+'">'+obj.series.label+' ('+percent+'%)</span>');
		}
		
		// Plot Graph
		setTimeout(function () {
		
			telepath.alerts.graphDistributionCanvas.flotGraph({ data: pie_data, options: options });
			$(".tele-alert-graph-distribution-canvas .tele-graph-canvas").bind('plothover', pieHover);
			
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
			},
			legend: { 
				show: true,
				position: "nw",
				margin: 20,
				sorted:"ascending",
				container: $("#alert-distribution-legend")
			},
			// tooltip: true,
		};

		function pieHover(event, pos, obj) 
		{
			if (!obj)
		    	return;
			percent = parseFloat(obj.series.percent).toFixed(2);
			$("#alert-distribution-showPercent").html('<span style="font-weight: bold; color: '+obj.series.color+'">'+obj.series.label+' ('+percent+'%)</span>');
		}
		
		// Plot Graph
		setTimeout(function () {
		
			telepath.alerts.graphDistributionCanvas.flotGraph({ data: pie_data, options: options });
			$(".tele-alert-graph-distribution-canvas .tele-graph-canvas").bind('plothover', pieHover);
			
		}, 100);
		
	},	
	_resize: function () {
		
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
		
	}
}
