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
				$(".tele-config-bar-left .tele-search-input").attr("disabled", false);
				$('#search-button').click();
				return;
			}

			data = data.items;

			treeData=telepath.config.actions.formatData(postData,data);

			callback.call(that, treeData);
			$(telepath.config.actions.contentLeftWrap).mCustomScrollbar('update');
			$(".tele-config-bar-left .tele-search-input").attr("disabled", false);
			$('#search-button').click();
		});
	},

	formatData: function(postData,data){

		var treeData = [];

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

		return treeData;
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
			icon.addClass('icon-delete-input').removeClass("tele-search-button");
		else
			icon.removeClass('icon-delete-input').addClass("tele-search-button");
		that.searchData = [];
		if (!that.actionOriginal)
			that.actionOriginal = that.ruleTree.children().children();

		$.each(that.actionOriginal, function (index, element) {
			var val = element.textContent.trim();
			if (val == that.searchString || (telepath.config.startsWith2(val, that.searchString)))
				that.searchData.push({key: val, hits: 0})
		});
	},

	test: function(obj, callback){

		var that = this;

		var params={};
		params.type='root';
		//that.data=telepath.config.actions.expand;
		that.treeData=that.formatData(params,that.searchData);

		callback.call(that.treeData)
		return ;

	},

	reload: function (search) {
		
		if(telepath.action.recorder.timer) {
			clearTimeout(telepath.action.recorder.timer);
		}
		
		var that = this;

		/*$("#search-button").on("click", function(event) {
			that.searchString='';
	
			that.input();
			that.reload(true);

		});
	*/

		if (typeof that.searchString != 'undefined'){
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			if (that.searchString.length>0)
			$("#search-button").addClass('icon-delete-input').removeClass("tele-search-button");
		}

		// add search on client site on key up event
		if (!search) {
			$(".tele-config-bar-left .tele-search-input").keyup('input', function () {
				that.searchString = $(this).val();
				
				that.input();
				console.log('bla');

				that.reload(true);

			});

		}


		if (!that.searchData){
			that.data=telepath.config.actions.expand;
		}
		else {

			//that.data=telepath.config.actions.test;
			//that.data=[];
			params={};
			params.type='root';
			params.expand= 'root';
			//that.data=telepath.config.actions.expand;
			that.data=telepath.config.actions.test;
			$(".tele-config-bar-left .tele-search-input").attr("disabled", false);
		}


		that.ruleTree = $('<div>');
	
		that.ruleTree.jstree({
		core : { data :  that.data},
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

	},
	init: function () {
		this.initTools();

		// disable the input box until the data is loaded (Moshe)
		$(".tele-config-bar-left .tele-search-input").attr("disabled", true);
		this.reload();
	},
	initTools: function() {	
		
		var that = this;
		
		// Search
		this.search = $('<div>').teleSearch({ callback: function (e, txt) {
			that.searchString = txt;
		}});
		
		// Create
		that.createCat = $('<div>').btn({ icon: 'plus', text: 'New Category', callback: function () {
			
			telepath.dialog({ msg: 'Enter new name for action category', type: 'prompt', callback: function(name) {
				
			}});
			
		}}).hide();
				
		this.barLeft.append(this.search).append(this.createCat);
		
	}
}