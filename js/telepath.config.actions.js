telepath.config.actions = {
	
	list: [],
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
				if(telepath.config.actions.searchString) { postData.search = telepath.config.actions.searchString; }
				telepath.config.actions.searchString='';
			break;
			case 'app':
				url = '/actions/get_app_actions';
				postData.host    = obj.data.id;
				postData.type    = 'application';
				postData.context = 'actions';
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
				
					$.each(data, function(i, row) {
					
						var text = row.key;
						var obj = { children: true, text: text, data: {id: row.key, type: 'app', ssl: row.ssl_flag }};
						treeData.push(obj);
						
					});
					
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
					
					if(data.length > 0) {
					
						$.each(data, function(i, action) {
							var flow_obj = { children: false, text: action.action_name, data: {id: action.action_name, type: "action", raw: action }};
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
			
		});
		
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
	reload: function () {
		
		if(telepath.action.recorder.timer) {
			clearTimeout(telepath.action.recorder.timer);
		}
		
		var that = this;
							
		that.ruleTree = $('<div>');
	
		that.ruleTree.jstree({
		core : { data : telepath.config.actions.expand },
		plugins: ["json_data","wholerow", "theme", "grid"],
		grid: {
			columns: [
				{width: 280 },
				{value: function (node) {
					/*
					return $('<div>').btn({ icon: 'edit', callback: function () {
						telepath.config.actions.editCat(node.id);
					}});
					*/
					
				}, width: 40 },
				{value: function (node) {
					
					if(node.type == 'action') {
						return $('<div>').btn({ icon: 'delete', callback: function () {
							telepath.config.actions.deleteFlow(node.raw);
						}});
					}
					
					
				}, width: 40 }
			],
			resizable:true
		}
		}).on('changed.jstree', function (e, data) {
			
			telepath.config.actions.contentRight.empty();
			telepath.config.actions.barRight.empty();
			telepath.config.actions.createCat.hide();
			
			if(data.node.data.type == 'action') {
				telepath.config.action.editAction(data.node.data.raw);
			}
			if(data.node.data.type == 'app') {
				telepath.action.currentApp = data.node.data.id;
				telepath.action.recorder.init();
				telepath.config.actions.createCat.show();
			}

		});
		
		//that.contentLeftWrap = $('<div>');
		//that.contentLeft.empty().append(that.contentLeftWrap);
		//that.contentLeftWrap
	
		that.contentLeft.empty().append(that.ruleTree);
	
		$(that.contentLeft).mCustomScrollbar({
			scrollButtons:{	enable: false },
			scrollInertia: 150,
			advanced: {
				updateOnContentResize: true
			}
		});
		
		that.initTools();
				
	},
	init: function () {
		this.reload();
	},
	initTools: function() {	
		
		var that = this;
		
		// Search
		this.search = $('<div>').teleSearch({ callback: function (e, txt) {
			that.searchString = txt;
			that.reload();
		}});
		
		// Create
		that.createCat = $('<div>').btn({ icon: 'plus', text: 'New Category', callback: function () {
			
			telepath.dialog({ msg: 'Enter new name for action category', type: 'prompt', callback: function(name) {
			
				
				
			}});
			
		}}).hide();
				
		this.barLeft.append(this.search).append(this.createCat);
		
	}
}