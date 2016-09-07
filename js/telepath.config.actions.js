telepath.config.actions = {
	
	list: [],
	sort: 'host',
	dir: true,

	getList: function() {
		
		var that = this;
		telepath.ds.get('/workflow/groups_get_general_cb', {}, function(data) {
			that.list = data.items;
		});
		
	},
	expand: function(obj, callback) {
		
		var that = this;
		
		var type = obj.data && obj.data.type ? obj.data.type : 'root';
		var url  = '';
		var postData = { };
		
		switch(type) {
			default:
			case 'root':
				url  = '/applications/get_expand';
				postData.type = 'root';
				postData.actions = true;
				postData.sort = telepath.config.actions.sort;
				postData.dir = telepath.config.actions.dir;
				postData.size = 150;
				postData.offset = telepath.config.actions.offset;
				if(telepath.config.actions.searchString) { postData.search = telepath.config.actions.searchString; }
			break;
			case 'app':
				url = '/actions/get_app_actions';
				postData.host    = obj.data.id;
				postData.type    = 'application';
				postData.context = 'actions';
				postData.domain = obj.data.domain;
			break;
		}
		
		telepath.ds.get(url, postData, function(data) {

			var treeData = [];
			
			// Validate data, return if null
			if(!data.items || data.items.length == 0) {
				callback.call(that, treeData);
				$(telepath.config.actions.contentLeftWrap).mCustomScrollbar('update');
				return;
			}
			
			data = data.items;
			
			switch(postData.type) {
			
				case 'root':

					telepath.config.actions.offset = (data.finished) ? 'finished' : telepath.config.actions.offset + data.data.length;


					$.each(data.data, function(i, row) {
					
						var text = row.host;
						//var children = [{ children: true, text: 'Root Domain', data: {id: row.host, type: 'app', ssl: row.ssl_flag }}];
						//if (typeof row.subdomains != "undefined" && row.subdomains != null && row.subdomains.length > 0){
						//	$.each(row.subdomains, function(i,subdomain){
						//		var sub = { children: true, text: subdomain, data: {id: subdomain, type: 'app' }};
						//		children.push(sub);
						//	})
						//}
						//var obj = { children: children, text: text};
						var childrens = [];
						if (typeof row.actions != "undefined" && row.actions != null && row.actions.length > 0) {

							$.each(row.actions, function (i, action) {
								var flow_obj = {
									children: false,
									text: action.action_name,
									icon: "tele-icon tele-icon-actions",
									data: {id: action.action_name, type: "action", raw: action}
								};
								childrens.push(flow_obj);
							});
						}

						if (typeof row.subdomains != "undefined" && row.subdomains != null && row.subdomains.length > 0 && typeof row.open != "undefined" && row.open) {
							$.each(row.subdomains, function (i, subdomain) {
								var flow_obj = {
									children: true,
									text: subdomain,
									data: {id: subdomain, type: "app", domain: "subdomain"}
								};
								childrens.push(flow_obj);
							});

						}

						var obj = {
							children: (childrens.length > 0) ? childrens : true,
							state: {opened: (childrens.length > 0) ? true : false},
							text: text,
							data: {id: row.host, type: 'app', ssl: row.ssl_flag, domain: "root"}
						}
						treeData.push(obj);
						
					});

					telepath.config.actions.loading = false;
					
				break;
				case 'application':
					
					/*if(data.action_categories.length > 0) {
					
						$.each(data.action_categories, function(i, row) {
						
							var obj = { children: false, text: row.name, data: {id: row.name, type: "action_category" }};
							
							if(row.expandable) {
							
								obj.children = [];
								
								$.each(data.actions, function(i, flow) {
									
									if(flow.category == row.name) {
										var flow_obj = { children: false, text: flow.group, data: {id: flow.id, type: "action" }};
										obj.children.push(flow_obj);
									}

								});
								
							}
							
							treeData.push(obj);
							
						});
					
					}*/
					
					if(data.actions.length > 0) {
					
						$.each(data.actions, function(i, action) {
							var flow_obj = { children: false, text: action.action_name, icon:"tele-icon tele-icon-actions",data: {id: action.action_name, type: "action", raw: action }};
							treeData.push(flow_obj);
						});
					
					}
					if(data.subdomains.length > 0) {
						$.each(data.subdomains, function(i, subdomain) {
							var flow_obj = { children: true, text: subdomain, data: {id: subdomain, type: "app", domain: "subdomain" }};
							treeData.push(flow_obj);
						});

					}
				
				break;
				default:
					//
				break;
			}
			

			callback.call(that, treeData);
			$(telepath.config.actions.contentLeftWrap).mCustomScrollbar('update');

		}, false, false, false);
		
	},
	data: [],
	deleteFlow: function(node) {
		
		var that = this;
		
		telepath.ds.get('/actions/set_delete_action', {
			
			uid: node.uid,
			action: node.action_name,
			application: node.application
			
		}, function(data) {
			
			that.reload();
			
		});
				
	},

	input: function(){
		var that = this;
		var icon= $("#search-button");
		if (that.searchString.length>0)
			icon.addClass('icon-delete-input2').removeClass("tele-search-button");
		else
			icon.removeClass('icon-delete-input2').addClass("tele-search-button");

		that.reload();
		//that.appTree.jstree('search', that.searchString);

	},

	reload: function () {
		
		if(telepath.action.recorder.timer) {
			clearInterval(telepath.action.recorder.timer);
			telepath.action.recorder.timer = false;
			telepath.action.recorder.endRecord();
		}

		var that = this;

		// reset the offset
		that.offset = 0;

		/*$("#search-button").on("click", function (event) {
			that.searchString = '';
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			that.input();

		});


		if (typeof that.searchString != 'undefined'){
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			that.input();
		}


		// add search on client site on key up event
		$(".tele-config-bar-left .tele-search-input").keyup('input', function () {
			that.searchString = $(this).val();
			console.log(that.searchString);
			that.input();
		});*/

		that.appTree = $('<div>');
		var treedata = telepath.config.actions.expand;
		that.createTree(that.appTree,treedata);

		//that.contentLeftWrap = $('<div>');
		//that.contentLeft.empty().append(that.contentLeftWrap);
		//that.contentLeftWrap
	
		that.contentLeft.empty().append(that.appTree);

		$(that.contentLeft).mCustomScrollbar({
			callbacks: {
				onTotalScroll: function () {

					if (that.loading || that.offset == 'finished') {
						return;
					}

					that.loading = true;

					$('.mCSB_container', that.list).append($(telepath.loader).css({
						float: 'left',
						clear: 'both',
						'bottom': 30,
						position: 'absolute'
					}));

					// add another jstree to the existing tree, because the create_node() function is very slow
					var anotherData = telepath.config.actions.expand;
					var anotherTree = $('<div>');
					that.createTree(anotherTree, anotherData);
					that.appTree.parent().append(anotherTree);



				},
			},
			scrollButtons: {enable: false},
			scrollInertia: 150,
			onTotalScrollOffset: 200,
			alwaysTriggerOffsets: false,
			advanced: {
				updateOnContentResize: true
			}
		});
				
	},
	init: function () {
		this.data=null;
		this.initTools();
		this.reload();

		// if there is a record in process, before exit telepath we send a Redis stop message to stop the
		// fast lane
		window.onbeforeunload = function () {
			if (telepath.action.recorder.timer) {
				telepath.action.recorder.endRecord();
			}
		}
	},
	initTools: function() {	
		
		var that = this;

		// Sort filters
		var sortRadios = $('<div>').radios({
			title: 'Sort By',
			items: [
				{id: 'host', icon: 'alphabetical', tip: 'ABC', dir: that.dir},
				{id: 'learning_so_far', icon: 'bars', tip: 'Count', dir: that.dir}
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
				that.reload();
			}
		});

		var rightPanel=$('<div>').attr('id', 'sort-radio').css('float','right').append(sortRadios);
		$('.tele-panel-topbar').append(rightPanel);


		// Search
		this.search = $('<div>').teleSearch({ callback: function (e, txt) {
			that.searchString = txt;
			//that.reload();
		}});
		
		// Create
		//that.createCat = $('<div>').btn({ icon: 'plus', text: 'New Category', callback: function () {
		//
		//	telepath.dialog({ msg: 'Enter new name for action category', type: 'prompt', callback: function(name) {
		//
		//
		//
		//	}});
		//
		//}}).hide();
				
		this.barLeft.append(this.search)/*.append(this.createCat)*/;

		$("#search-button").on("click", function (event) {
			that.searchString = '';
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			that.input();

		});


		if (typeof that.searchString != 'undefined'){
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			that.input();
		}

		var typingTimer;                //timer identifier
		var doneTypingInterval = 1000;

		// add search on client site on key up event
		$(".tele-config-bar-left .tele-search-input").keyup('input', function () {
			clearTimeout(typingTimer);
			if ($(".tele-config-bar-left .tele-search-input").val()){
				typingTimer = setTimeout(function(){
					that.searchString= $(".tele-config-bar-left .tele-search-input").val();
					that.input();
				}, doneTypingInterval);
			}
		});
	},
	createTree: function(div,treedata){
		var that = this;
		div.jstree({
			core: {data: treedata},
			plugins: ["json_data", "wholerow", "theme", "grid", "search"],
			grid: {
				columns: [
					{width: 370},
					{
						value: function (node) {
							/*
							 return $('<div>').btn({ icon: 'edit', callback: function () {
							 telepath.config.actions.editCat(node.id);
							 }});
							 */

						}, width: 40
					},
					{
						value: function (node) {

							if (node.type == 'action') {
								return $('<div>').btn({
									icon: 'delete', callback: function () {
										telepath.config.actions.deleteFlow(node.raw);
									}
								});
							}


						}, width: 40
					}
				],
				resizable: true,
			}/*,
			 search: {
			 "fuzzy":false,
			 "case_insensitive": true,
			 "show_only_matches" : true,
			 search_callback : function (str, node) {
			 if(node.text === str) { return true; }
			 }
			 }*/
		}).on('changed.jstree', function (e, data) {
			// check if the record is on
			if (telepath.action.recorder.timer) {
				telepath.dialog({
					type: 'dialog',
					title: 'Business Actions',
					msg: 'Are you sure that you want to stop the Business Action record?',
					callback: function () {
						clearInterval(telepath.action.recorder.timer);
						telepath.action.recorder.endRecord();
						telepath.action.recorder.timer = false;
						that.appTree.trigger("restart", data);
					}
				});
			}
			else {
				$(this).trigger("restart", data);
			}
		}).on('restart', function (e, data) {
			data.instance.element.find('.jstree-wholerow').css('background-color', '#FFFFFF');
			data.instance.element.find('#' + data.selected[0]).children(":first").css("background-color", "rgba(189, 189, 189, 0.85)");

			telepath.config.actions.contentRight.empty();
			telepath.config.actions.barRight.empty();
			//	telepath.config.actions.createCat.hide();

			if (data.node.data.type == 'action') {
				telepath.config.action.editAction(data.node.data.raw);
			}
			if (data.node.data.type == 'app') {
				telepath.action.currentApp = data.node.data.id;
				telepath.action.recorder.init();
				//	telepath.config.actions.createCat.show();
			}
		});
		/*.on('ready.jstree', function(e, data) {
		 data.instance.search(that.searchString);
		 });*/
	},
	checkNotFinishedRecord: function () {
		if (telepath.action.recorder.timer) {
			clearInterval(telepath.action.recorder.timer);
			telepath.action.recorder.endRecord();
			telepath.action.recorder.timer = false;
		}
	}
};