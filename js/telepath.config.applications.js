telepath.config.applications = {
	searchString: '',
	formatSearchData: function(data) {
		
		var treeData = [];
		$.each(data, function(i, row) {
			
			var children = false;
			
			/*if(row.type == 'app' || row.type == 'page') {
				children = true;
			}*/
			if(row.type == 'app') {
				children = true;
			}
			
			var obj  = { children: children, name: row.text, text: row.text, data: row, 'icon': 'tele-icon-' + row.type};
			
			if(row.type == 'page') {
				obj.text = row.host + obj.text;
			}
			if(row.type == 'param') {
				obj.data.host = row.host;
				obj.data.uri = row.uri;
				obj.text = row.host + row.uri + " - " + row.text + "&nbsp;(" + row.param_type + ")";
			}
			
			treeData.push(obj);
			
		});
		return treeData;
		
	},
	formatData: function(data, root) {
		if(!root) { root = '' }
		// Recurse for children, use json key as text to display
		if(!data) return;
		var that = this;
		var treeData = [];
		$.each(data, function(i, row) {
			var text = row.key /*+ '&nbsp;(' + row.hits + ')'*/;
			var obj  = { children: false, text: text, data: { type: 'app', host: row.key }, 'icon': 'tele-icon-app'};
			treeData.push(obj);
		});
		return treeData;
		
	},
	formatDataPages: function(data, i, host) {
		
		if(!data) { return; }
		
		var that = this;
		var treeData = [];
		$.each(data, function(i, row) {
			
			console.log(typeof(row));
			if(typeof(row) == 'object') {
			
				// EXPAND = LEVEL
				var obj  = { children: that.formatDataPages(row, i, host), text: i, data: { type: 'dir', text: i }, 'icon': 'tele-icon-dir'};
				treeData.push(obj);
				
			} else {
			
				var obj  = { children: true, text: i, data: { type: 'page', path: row, host: host }, 'icon': 'tele-icon-page'};
				treeData.push(obj);
				// EXPAND = PARAM
			}

		});
		return treeData;
		
	},
	expand: function(obj, callback) {
		
		var that = this;
		
		telepath.ds.get('/applications/get_expand', { search: telepath.config.applications.searchString, context: 'applications' }, function(data) {
			
			var treeData = telepath.config.applications.formatData(data.items);
			callback.call(that, treeData);
			
		});
		telepath.config.applications.searchString='';
	},
	data: [],
	reload: function () {
		
		var that = this;
							
		that.appTree = $('<div>');
		
		that.contentLeftWrap = $('<div>').css({ padding: 0, height: $(that.contentLeft).parent().height() - 20 });
		that.contentLeft.empty().append(that.contentLeftWrap);
		that.contentLeftWrap.append(that.appTree);

		$(that.contentLeftWrap).mCustomScrollbar({
			scrollButtons:{	enable: false },
			scrollInertia: 150,
			advanced: {
				updateOnContentResize: true
			} 
		});
		

		
		that.appTree.jstree({
		core : { data : telepath.config.applications.expand, progressive_render: true },
		plugins: ["json_data","wholerow", "theme", "grid", "contextmenu"],
		contextmenu: { items: telepath.contextMenu },
		grid: {
			columns: [
				{width: 280 },
				{value: function (node) {
					return $('<div>').btn({ icon: 'edit', callback: function (tree) {
						$nodeParent = tree.element.parents('[role="treeitem"]');

						telepath.config.application.editApp(node.host, $nodeParent);
					}});
					
				}, width: 40 },
				{value: function (node) {
					return $('<div>').btn({ icon: 'delete', callback: function (tree) {

						$nodeParent = tree.element.parents('[role="treeitem"]');

						telepath.config.application.deleteApp(node.host, $nodeParent)
					}});
					
				}, width: 40 }
			],
			resizable:true
		}
		}).on('changed.jstree', function (e, data) {
			console.log('App Changed');
			console.log(data);
			if(data && data.node) {
				data.instance.element.find('.jstree-wholerow').css('background-color', '#FFFFFF');
				data.instance.element.find('.jstree-wholerow-hovered').css("background-color", "rgba(189, 189, 189, 0.85)");
				telepath.config.application.editApp(data.node.data.host);
			}
		});
		
	},
	init: function () {
		this.initTools();
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
		this.create     = $('<div>').btn({ icon: 'plus', text: 'New', callback: function () {
			telepath.config.application.createApp();
		} });
		
		this.barLeft.append(this.search).append(this.create);
		
	}
}
