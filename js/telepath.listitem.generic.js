if(!telepath.listitem) { telepath.listitem = {}; }


telepath.listitem.generic = {
	formatter_dashboard: function(item) {
		return telepath.listitem.generic.formatter(item, 'dashboard');
	},
	formatter: function(item, mode) {
		
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
					{ key: 'country', value: item.country },
					{ key: 'IP', value: item.ip_orig },
					{ key: 'city', value: item.city },
					{ key: 'host', value: grabNames(item.host) },
					{ key: 'alerts', value: item.alerts_count },
					{ key: 'actions', value: item.actions_count }
				]
				
		}
		if(mode == 'dashboard') {
			findAndRemove(result.details, 'key', 'city');
		}
		
		return result;
		
	},
	callbacks: {
	
		click: function (widget) {
			
			$('.popover').remove();
			setTimeout(function () {
				$('.popover').remove();
			}, 1000);
			
			telepath.sessionflow.init(widget.options.itemID, widget.element.parent().parent(), widget.options.icon, widget.options.raw.searchkey);
		},
		hover_in: function(el, item) {
			
			telepath.generic_popover_loading = true;
			setTimeout(function () {
				telepath.generic_popover_loading = false;
			}, 1000);
			if(telepath.generic_popover_timer) {
				clearTimeout(telepath.generic_popover_timer);
			}
			$('.popover').remove();
			if(telepath.generic_popover) {
				telepath.generic_popover.remove();
			}
			telepath.generic_popover = $('<div>');
			$('body').append(telepath.generic_popover);
			$(telepath.generic_popover).css({
					position: 'absolute',
					top: $(el).offset().top + 25,
					left: $(el).offset().left + 70
			}).fadeIn().popover({
				title: 'Loading anomaly scores..',
				html: true,
				content: telepath.loader
			}).popover('show');

			//console.log(item);
			if (!item)
			{
				return;
			}

			if(item.raw.alerts_count && item.raw.alerts_count > 0 && item.raw.alerts_names && item.raw.alerts_names.length > 0) {

                $('.popover').remove();

                telepath.generic_popover.remove();

                telepath.generic_popover = $('<div>');

                $('body').append(telepath.generic_popover);

                var alerts_title = $('<h3>').addClass('popover-title').addClass('not-round').html('Alerts');
                var alerts_content = $('<div>').addClass('popover-content');

				$.each(item.raw.alerts_names, function (i, x) {
					
					var row = $('<div>').addClass('tele-popover-row')
										.append($('<div>').addClass('tele-icon').addClass('tele-icon-alert'))
										.append($('<div>').addClass('tele-count').text(x.doc_count))
										.append($('<div>').addClass('tele-popover-subtitle').html(x.key));
										
					alerts_content.append(row);
					
				});
                $(telepath.generic_popover).css({
                    position: 'absolute',
                    top: $(el).offset().top - 45,
                    left: $(el).offset().left + 70
                }).fadeIn().popover({
                    title: 'Loading anomaly scores..',
                    html: true,
                    content: telepath.loader
                }).popover('show');

                $('.popover').append(alerts_title).append(alerts_content);

			}
			if(item.raw.actions_count && item.raw.actions_count > 0 && item.raw.actions_names && item.raw.actions_names.length > 0) {

				var actions_title = $('<h3>').addClass('popover-title').addClass('not-round').html('Actions');
				var actions_content = $('<div>').addClass('popover-content');

				$.each(item.raw.actions_names, function (i, x) {

					var row = $('<div>').addClass('tele-popover-row')
										.append($('<div>').addClass('tele-icon').addClass('tele-icon-actions'))
										.append($('<div>').addClass('tele-count').text(x.doc_count))
										.append($('<div>').addClass('tele-popover-subtitle').html(x.key));

					actions_content.append(row);

				});

				$('.popover').append(actions_title).append(actions_content);

			}

			telepath.ds.get('/sessionflow/get_session_stats', { sid: item.itemID }, function (data) {

				$('.popover-title:first').html('Anomaly Scores');
				$('.popover-content .tele-loader').after($('<div>').anomalyScore({ request: data.items })).remove();

			});

		},
		hover_out: function(el, item) {
			if(telepath.generic_popover_loading) return;
			telepath.generic_popover_timer = setTimeout(function () {
				$('.popover').fadeOut(function () {
					$('.popover').remove();
				});
			}, 1000);
		},
		favorite: function(widget) {
				
			telepath.ds.get('/cases/set_case_fav', {
				cid: widget.options.dataID,
				favorite: widget.options.favorite
			}, function (data) {});
				
		}
	},
	callbacks_case: {

		click: function (widget) {
			if (telepath.access.admin || telepath.access.perm.Cases_get){
				$(".tele-nav-cases a").click();
				$('.popover').remove();
				telepath.casePanel.init(widget.options.dataID);
			}else{
				telepath.dialog({msg:'Access denied. No permissions to view Cases details.'});
			};
		},
		hover_in: function (el, opt) {
			
			console.log(opt);
			
			var cid = opt.dataID;
			
			$('.popover').remove();
			
			var that = this;
			
			if(telepath.cases.pop) {
				telepath.cases.pop.remove();
			}
			
			telepath.cases.pop = $('<div>').css({ 
				position: 'absolute', 
				top: $(el).offset().top,
				left: $(el).offset().left + 70
			});
			
			$('body').append(telepath.cases.pop);
			$(telepath.cases.pop).popover({ 
			title: 'Loading Data', 
			html: true,
			content: telepath.loader 
			}).popover('show');
			
			telepath.ds.get('/cases/get_case_stat', { cid: cid }, function (data) {
				
				var options = {
					legend: { show: false },
					series: { lines: { show: true, fill: true }, points: { show: true, fillColor: '#446077' } },
					yaxis: { alignTicksWithAxis: true, labelWidth: 30, ticks: 5, color: '#446077', font: { family: 'Arial', color: '#cccccc', size: 11, weight: "normal" } },
					selection: { mode: "x" },
					xaxis: { alignTicksWithAxis: true, tickColor: '#cccccc', tickLength: 7, font: { family: 'Arial', color: '#cccccc', size: 11, weight: "normal" }, mode: "time", timezone: "browser", timeformat: "%d/%m" },
					grid: { borderColor: '#446077', borderWidth: 1 }
				};
				
				data = [{ label: "Sessions", data: data.items, color: '#FC3D3D' }];
				
				// Plot Graph
				var graphContainer = $('<div>').addClass('case-popover-graph');
				
				$('.popover-title').html('Last 7 days');
				$('.popover-content').empty().append(graphContainer);
				
				graphContainer.flotGraph({ data: data, options: options });
				
				//$('.popover').append('<div class="popover-title not-round">Related Info</div>');
				//$('.popover').append('<div class="popover-content">Related info content</div>');
			
			});
									
		},
		hover_out: function (el, id) {
			
			if(telepath.cases.timeout) {
				clearTimeout(telepath.cases.timeout);
			}
			if(telepath.cases.pop) {
				telepath.cases.pop.remove();
			}
		
		},
		favorite: function(widget) {
				
			telepath.ds.get('/cases/set_case_fav', {
				cid: widget.options.name,
				favorite: widget.options.favorite
			}, function (data) {});
				
		}
	
	}
}
