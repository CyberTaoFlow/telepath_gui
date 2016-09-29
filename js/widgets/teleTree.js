$.widget( "tele.teleTree", {

    options: {
		type: 'rules',
		callback: function(e, data) {},
		grid: {
			columns: [
				{width: $(window).width() < 1200 ? 245 : 415},
				/*{value: function (node) {
					
					return $('<div>').btn({ icon: 'edit', callback: function () {
						telepath.config.rules.editCat(node.id);
					}});
					
				}, width: 40 },*/
				{value: function (node) {

					return $('<div>').btn({ icon: 'delete', callback: function (tree) {
						$nodeParent = tree.element.parent().parent().parent('.jstree-node');
						if (node.type == 'group'){
							telepath.config.rule.delRule(node.name, node.category);
						}
						if (node.type == 'category'){
							telepath.config.rules.delCategory(node.name);
						}
					}});
					
				}, width: 40 }
			],
			resizable:true
		},
		searchString: ''
    },
    _create: function() {
        this.element.addClass( "tele-tree" );
        this._update();
    },
 
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        //this._update();
    },
	
	expand: function(obj, callback) {
		
		// Setup
		var that = this;
		var treeType = this.options.type;
		var nodeType = obj.data && obj.data.type ? obj.data.type : 'root';
		var postData = { };
		var postUrl  = '';

		if (telepath.config.rules.searchString){
			nodeType='search';
		}
		
		switch(treeType) {
			
			case 'rules':

				switch(nodeType) {
					default:
					case 'root':
						
						postUrl = '/rules/expand_root';
						postData.type = 'category';
						
					break;
					case 'category':
						
						postUrl = '/rules/expand_category';
						postData.type = 'group';
						postData.id   = obj.data.id;
						
					break;

					case 'search':
						postUrl = '/rules/searchRules';
						postData.search = telepath.config.rules.searchString;

				}
			
			break;
		
		}

		telepath.ds.get(postUrl, postData, function(data) {
			var treeData = [];

			if (nodeType=='search'){

				var child={};
				if (Object.keys(data.items).length){
					$.each(data.items, function (i, item) {
						var obj = {
							children:[],
							text: i,
							data: {id: i, type: 'category', name: i, category:item[0].category}};
						$.each(item, function (j, row){
							child = {
								children: false,
								text: row.name,
								data: {id: row.id, type: 'group', name: row.name, category: row.category}
							};
							obj.children.push(child)
						});

						treeData.push(obj)
					});
				}
			}
			else if(data.items.length){
				$.each(data.items, function (i, row) {

					var obj = {
						children: true,
						text: row.name,
						data: {id: row.id, type: postData.type, name: row.name, category: row.category}
					};

					if (that.options.type == "rules") {
						telepath.config.rules.categories = data.items;
					}

					if (postData.type == 'group') {
						obj.children = false;
					}
					treeData.push(obj);
				});
			}
			else{
				telepath.config.rules.categories = data.items;
			}
			callback.call(that, treeData);
		});
		
	},	
    _update: function() {

		// Init
		var that = this;
		this.teleTree = $('<div>');
		this.element.append(this.teleTree);
		
		// Start Tree
		this.teleTree.jstree({
			core: { 
				data: function(obj, callback) {
					that.expand(obj, callback);
				}
			},
			plugins: ["json_data","wholerow", "theme", "grid"],
			grid: that.options.grid,
		}).on('changed.jstree', function (e, data) {
				data.instance.element.find('.jstree-wholerow').css('background-color', '#FFFFFF');
				data.instance.element.find('.jstree-wholerow-hovered').css("background-color", "rgba(189, 189, 189, 0.85)");

				var obj =  data.instance.get_node(data.node, true);
				if(obj) {
					obj.siblings(".jstree-open").each(function () { data.instance.close_node(this,true); });

			}

			if (data.node.parent=='#'){
				var category = that.teleTree.jstree(true)._model.data;
				var selectedCategory = [];
				$.each(category, function (i, val) {
					if (val.parent == data.node.id) {
						selectedCategory.push(val.data)
					}
				});
				telepath.config.rules.categories = selectedCategory;
			}
			that.options.callback(e, data);
		}).on('loaded.jstree', function(e, data) {
			if (telepath.config.rules.searchString){
				that.teleTree.jstree('open_all');
			}
		}).on('select_node.jstree', function (e, data) {
			data.instance.toggle_node(data.node);
		});

		$(this.element).mCustomScrollbar({
			scrollButtons:{	enable: false },
			scrollInertia: 150,
			advanced: {
				updateOnContentResize: true
			}   
		});
	
    },
	

});
