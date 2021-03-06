telepath.cases = {
	
	sort: 'date',
	dir: false,
	data: [],
	searchString: '',
	loading: false,
	init: function () {
		
		this.drawUI();
		this.refresh();
		
	},
	refresh: function(callback) {

		this.loading = true;
		$('.tele-panel-cases .tele-panel-topbar-right').addClass('wait');
		this.container = $('.tele-panel-cases .tele-panel-cases-inner');
		$('.tele-block, .tele-loader', this.container).remove();
		this.container.append(telepath.loader);


		var that = this;
		
		telepath.ds.get('/cases/get_cases', {
			search: this.searchString,
			sort: this.sort,
			dir: this.dir
		}, function (data) {
			// Hide deleted cases. Yuli
			that.loading=false;
			$('.tele-panel-cases .tele-panel-topbar-right').removeClass('wait');

			var cases = []
			var index = 0;
			for (index = 0; index < data.items.length; ++index) {
				if (data.items[index].name)
				{
					cases.push(data.items[index]);
				}
			}
			that.setData(cases);
			if(typeof(callback) == 'function') {
				callback();
			}
		},false, false, true);

		/*if (telepath.cases.searchString)
		{
			$('.tele-panel-cases .tele-search-input').prop("value",telepath.cases.searchString);
		}*/

	},
	hardRefresh: function(callback){
		deleteCache('telecache');
		this.refresh(callback);
	},
	deleteCasesCache: function(){
		// delete browser session storage cases cache
		deleteCache('telecache/dashboard/get_cases');
		deleteCache('telecache/dashboard/get_chart');
		deleteCache('telecache/cases');
	},
	setData: function(data) {
		
		this.container = $('.tele-panel-cases .tele-panel-cases-inner');
		var that = this;
		this.data = data;
		
		$('.tele-block, .tele-loader', this.container).remove();
		
		// Create List
		this.list = $('<div>');
		this.container.append(this.list);

		// Init List
		this.list.teleList({ 
		data: this.data,
		formatter: function(item) {
			
			item.checkable = true;
			item.favorites = true;
			item.favorite  = item.case_data.favorite == '1';
			
			return telepath['case'].rowFormatter(item);
			
		}, callbacks: telepath.listitem.generic.callbacks_case
		});

		// Update title + Create Add Button
		this.panelTitle.html( thousandsFormat(this.data.length) + ' Cases');
		
		// Bind resize hooks
		setTimeout(function () {
			that._resize();
		}, 0);
		$(window).resize(function () { that._resize() });

	},
	_resize: function () {
		
		if($('.tele-panel-cases').children().size() == 0) return;
		// console.log('Cases Resize');
		
		var height = $(window).height();
		$('.tele-body').css({ height: height });
		var offset = height - 
					 $('.tele-header').outerHeight() - 
					 $('.tele-panel-topbar').outerHeight() - 
					 $('.tele-panel-subtitle').outerHeight();
		
		$('.tele-panel-cases .tele-block').height(offset - 20);
		$('.tele-panel-cases .tele-block .tele-list').height(offset - 50);
		$('.tele-panel-cases .tele-list').mCustomScrollbar("update");
		
	},
	drawUI: function () {
		
		var that = this;
		// Add Common HTML
		$('.tele-panel-cases').empty();
		
		var container = $('<div>').addClass('tele-panel-cases-inner');
		$('.tele-panel-cases').append(container);
		
		var panelTopBar = $('<div>').addClass('tele-panel-topbar');
		var panelSubBar = $('<div>').addClass('tele-panel-subtitle');
		var panelTitle  = $('<div>').addClass('tele-panel-title');
		var panelTopBarRight = $('<div>').addClass('tele-panel-topbar-right');
		
		panelTopBar.append(panelTitle).append(panelTopBarRight);
		
		//panelTitle.html('Active Cases');

		this.panelTitle = panelTitle;
		
		var addBtn = $('<div>').btn({ icon: 'plus', text: 'New Case', callback: function () { 
			if (telepath.access.admin || telepath.access.perm.Cases_add){
				telepath.caseOverlay.addCase();
			}else{
				telepath.dialog({msg:'Access denied. No permissions to add new Case group.'});
			};
		}});
		this.panelTitle.after(addBtn);

		/*var searchCases = $('<div>').teleSearch({ callback: function (e, txt) {
			// Search
			telepath.cases.searchString = txt;
			telepath.cases.refresh();

		}});*/

		/*// reset button in search input
		var resetInput=$('<a>').addClass('icon-delete-input2').attr('id', 'remove-button').click(function(){
			$('.tele-panel-cases .tele-search-input').val('');
			telepath.cases.searchString = '';
			telepath.cases.refresh();
		});*/

		//searchCases.append(resetInput);

		//panelSubBar.append(searchCases);

		container.append(panelTopBar);
		container.append(panelSubBar);
				
		// Sub bar items
		// --------------------------------------
		
		// Select all cases
		var checkallEl = $('<a>').teleCheckbox({ callback: function (e) {
			if(that.list) {
				that.list.data('tele-teleList').toggleAll(e.options.checked);
			}
		}});
		panelSubBar.append(checkallEl);
		
/*		// Archive cases
		var archiveBtn = $('<div>').btn({ icon: 'archive', text: 'Archive Cases', callback: function () { console.log('Archive'); }});
		panelSubBar.append(archiveBtn);
		
		panelSubBar.append('<div class="tele-navsep"></div>'); // Sep*/
		
		// Delete cases
		var deleteBtn = $('<div>').btn({ icon: 'delete', text: 'Delete', callback: function () { 
			if(that.list) {
				var selected = that.list.data('tele-teleList').getSelected();
				if(selected.length == 0){
					telepath.dialog({msg:'No Case selected.'});
				}else{
					if (telepath.access.admin || telepath.access.perm.Cases_del){
					telepath.dialog({
					type: 'dialog',
					title: 'Confirm',
					msg: 'Remove ' + selected.length + ' case(s)?',
					callback: function () {
						telepath.ds.get('/cases/del_cases', { cids: selected }, function (data) {
							that.deleteCasesCache();
							that.setData(data.items);

							telepath.ds.get('/cases/flag_requests_by_cases', { case: selected, range: false, method: 'delete', repeat: false  }, function (data) {
								// console.log('Delete the case:' + data);
							});
						});
					}
					});
					}else{
						telepath.dialog({msg:'Access denied. No permissions to delete Cases.'});
					};
				}
			}
		}});
		panelSubBar.append(deleteBtn);
		
		//panelSubBar.append('<div class="tele-navsep"></div>'); // Sep
		
		// Sort filters
		var sortRadios = $('<div>').radios({ 
			title: 'Sort By', 
			items: [
				{id: 'date', icon: 'time', tip: 'Time', dir: that.dir},
				{id: 'name', icon: 'alphabetical', tip: 'ABC', dir: that.dir},
				{id: 'count', icon: 'bars', tip: 'Count', dir: that.dir}
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
		//panelSubBar.append(sortRadios);
		
		// Search
		// var searchCases = $('<div>').teleSearch({ callback: function (e, txt) {
		//	 telepath.cases.searchString = txt;
		//	 telepath.cases.refresh();
		// }});
		// panelSubBar.append(searchCases);
		
		// Filters
		// Container
		var container = $('.tele-panel-cases .tele-panel-topbar-right');
		
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

		// Refresh
		var cmdRefresh = $('<div>').addClass('tele-refresh');
		var cmdRefreshButton = $('<a>').addClass('tele-refresh-button').html('&nbsp;');
		cmdRefresh.append(cmdRefreshButton);

		cmdRefreshButton.click(function () {
			if (!telepath.cases.loading) {
				var that = this;
				telepath.cases.hardRefresh();
			}
		});
		
		// Append All
		container.append(sortRadios).append('<div class="tele-navsep"></div>').append(filterDateRange).append('<div class="tele-navsep"></div>').append(filterApps).append('<div class="tele-navsep"></div>').append(cmdRefresh);
	
	}
	
}
