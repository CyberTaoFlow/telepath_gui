$.widget( "tele.teleTree", {

    options: {
		type: 'rules',
		callback: function(e, data) {},
		grid: {
			columns: [
				{width: 280 },
				/*{value: function (node) {
					
					return $('<div>').btn({ icon: 'edit', callback: function () {
						telepath.config.rules.editCat(node.id);
					}});
					
				}, width: 40 },*/
				{value: function (node) {

					return $('<div>').btn({ icon: 'delete', callback: function (tree) {
						$nodeParent = tree.element.parent().parent().parent('.jstree-node');
						if (node.type == 'group'){
							telepath.config.rule.delRule(node.name, node.category, $nodeParent);
						}
						if (node.type == 'category'){
							telepath.config.rules.delCategory(node.name);
						}
					}});
					
				}, width: 40 }
			],
			resizable:true
		}
    },
    _create: function() {
        this.element.addClass( "tele-tree" );
        this._update();
    },
 
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        this._update();
    },
	
	expand: function(obj, callback) {
		
		// Setup
		var that = this;
		var treeType = this.options.type;
		var nodeType = obj.data && obj.data.type ? obj.data.type : 'root';
		var postData = { };
		var postUrl  = '';
		
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
				}
			
			break;
		
		}

		telepath.ds.get(postUrl, postData, function(data) {
			var treeData = [];
			$.each(data.items, function(i, row) {
			
				var obj = { children: true, text: row.name, data: { id: row.id, type: postData.type, name: row.name, category: row.category }};
				
				if(that.options.type == "rules") {
					telepath.config.rules.categories = data.items;
				}
				
				if(postData.type == 'group') {	
					obj.children = false;
				}
				treeData.push(obj);
			});
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
			that.options.callback(e, data);
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
