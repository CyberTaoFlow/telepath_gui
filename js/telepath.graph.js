$.widget( "tele.flotGraph", {
 
    // Default options.
    options: {
		data: [],
		options: [],
		dashboard: false,
		title: false,
    },
 
    _create: function() {
		
        this.element.addClass( "tele-graph" );
        this._update();
		
    },
 
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        this._update();
    },
 
    _update: function() {
		
		var that = this;
		
		this.canvasOuter = $('<div>').addClass('tele-graph-canvas-outer');
		this.canvasInner = $('<div>').addClass('tele-graph-canvas');
		this.masterCanvasInner =$('<div>').addClass('tele-graph-canvas-master-inner');
		this.masterCanvas =$('<div>').addClass('tele-graph-canvas-master');
		this.closeEl     = $('<a>').addClass('tele-graph-close').addClass('tele-icon').addClass('tele-icon-close');

		this.closeEl.click(function () {
			that.masterCanvas.css({visibility: 'hidden'});
			that.plotObj.destroy();
			that.plot();
		}).hover(function () {
			$(this).addClass('hover');
		}, function () {
			$(this).removeClass('hover');
		});

		this.element.empty();
		
		if(this.options.title) {
			var graphTitle = $('<div>').addClass('tele-graph-title').html(this.options.title);
			this.element.append(graphTitle);
		}
		
		this.canvasOuter.append(this.canvasInner);
		this.masterCanvas.append(this.masterCanvasInner).append(this.closeEl );
		this.element.append(this.masterCanvas).append(this.canvasOuter);
		
		if(this.options.dashboard) {
			
			
			// Graph Filters		
			this.filterTypes = [
				{ type: 'case-alerts', label: 'Cases', count: 0, active: true, suffix: 'Tx' },
				{ type: 'noncase-alerts', label: 'Alerts', count: 0, active: true, suffix: 'Tx' },
				{ type: 'suspicions', label: 'Suspects', count: 0, active: true, suffix: 'Tx' },
				{ type: 'other-sessions', label: 'Normal', count: 0, active: true, suffix: 'Tx' },
				//{ type: 'score', label: 'Score', count: 0, active: true, suffix: 'Tx' }
			];
					
			var totalCount = 0;
			
			$.each(that.filterTypes, function(i, filter) {
				if (filter.label == 'Cases'){
					$.each(that.options.data[2].data, function(z, count) {
						filter.count = filter.count + parseInt(count[1]);
						//totalCount = totalCount + parseInt(count[1]);
					});
					return
				}
			$.each(that.options.data, function(x, data) {
				
				if(data.label == filter.label) {
					
					filter.count = 0;
					$.each(data.data, function(z, count) {
						filter.count = filter.count + parseInt(count[1]);
						totalCount = totalCount + parseInt(count[1]);
					});					
					
				}
			
			});
			});
			
			this.dashboardGraphFilters = $('<div>').addClass('tele-dashboard-graph-filters');
			$('.tele-graph-canvas-outer').append(this.dashboardGraphFilters);
			
			$.each(this.filterTypes, function(i, filter) {
				
				var filterWrap    = $('<div>').addClass('tele-dashboard-graph-filter-inner').addClass('tele-graph-filter-' + filter.type);
				var filterToggle  = $('<a>').addClass('tele-graph-filter-toggle');
				var filterTitle   = $('<div>').addClass('tele-graph-filter-title').text(filter.label);
				var filterPercent = $('<div>').addClass('tele-graph-filter-percent').text((totalCount > 0 ? parseFloat(filter.count / totalCount * 100).toFixed(2) : 0) + '%');
				var filterCount   = $('<div>').addClass('tele-graph-filter-count')
					.text(filter.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + filter.suffix);

				var div2 = $('<div>').addClass('tele-graph-filter-inner-right-content').append(filterPercent).append(filterCount);

				filterWrap.append(filterToggle).append(filterTitle).append(div2);

				var div = $('<div>').addClass('tele-dashboard-graph-filter').append(filterWrap);

				that.dashboardGraphFilters.append(div);

				
				if(filter.active) {
					filterToggle.addClass('active');
				}
				
				filterToggle.click(function () {
					
					if($(this).hasClass('active')) {
						$(this).removeClass('active');
						that.filterTypes[i].active = false;
					} else {
						$(this).addClass('active');
						that.filterTypes[i].active = true;
					}
					
					that.updateFilters();
					
				});
				
			});
			
			this.resize();
			this.dashboardGraphFilters.resize(function () {
				that.resize();
			});
			
			this.updateFilters();
			
		}
		
		this.printData = this.options.data;
		
		this.plot();
		
    },
	updateFilters: function() {
		
		var that = this;
		
		this.printData = [];
		
		$.each(that.filterTypes, function(i, filter) {
		
			if(filter.active) {
			
				$.each(that.options.data, function(x, data) {
					
					if(data.label == filter.label) {
						
						that.printData.push(data);
						
					}
				
				});
			
			}
			
		});
		
		this.plot();
	
	},
	plot: function() {

		var that = this;
		this.plotObj = $.plot(this.canvasInner, this.printData, this.options.options);

		if (this.options.dashboard) {

			var timeformat = ((telepath.range.end - telepath.range.start) / 3600 > 48) ? "%d/%m/%y" : "%d/%m %h:%M:%S";
			var options = {
				legend: {show: false},
				series: {lines: {show: true, fill: true}},
				yaxis: {ticks: 0},
				selection: {mode: "xy"},
				xaxis: {ticks: 0,},
				grid: {borderColor: '#446077', borderWidth: 1, hoverable: false, clickable: false}
			};
			this.masterPlotObj = $.plot(this.masterCanvasInner, this.printData, options);

			$(".tele-panel-dashboard  .tele-graph-canvas").bind("plotselected", function (event, ranges) {
				that.masterCanvas.css({visibility: 'visible'});
				that.plotObj = $.plot($(".tele-panel-dashboard  .tele-graph-canvas"), that.printData,
					$.extend(true, {}, that.options.options, {
						xaxis: {min: ranges.xaxis.from, max: ranges.xaxis.to},
						yaxis: {min: ranges.yaxis.from, max: ranges.yaxis.to}
					}));

				that.masterPlotObj.setSelection(ranges, true);
			});

			$(".tele-panel-dashboard  .tele-graph-canvas-master-inner").bind("plotselected", function (event, ranges) {
				that.plotObj.setSelection(ranges);
			});
		}
	},
	resize: function () {

		$(this.dashboardGraphFilters).css({marginLeft: this.options.options.yaxis.labelWidth })
	}

});