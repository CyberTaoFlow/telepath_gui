telepath.config.applications = {

	sort: 'host',
	dir: true,

	formatSearchData: function (data, mode) {

		var treeData = [];
		$.each(data, function (host, row) {

			var children = true;
			var opened = false;

			if (row) {
				opened = true;
				children = [];
				$.each(row, function (name, b) {
					var obj = (mode == 'page') ? {type: mode, host: host, path: name} : {type: mode, name: name};
					children.push({data: obj, text: name, icon: 'tele-icon-' + mode});
				});

			}

			var obj = {
				children: children,
				name: host,
				text: host,
				data: {type: 'app', text: host},
				icon: 'tele-icon-app',
				state: {opened: opened}
			};

			treeData.push(obj);

		});
		return treeData;

	},
	oldFormatSearchData: function(data) {

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
	formatData: function(data,count, root) {
		if(!root) { root = '' }
		// Recurse for children, use json key as text to display
		if(!data) return;
		count = count !== false;
		var that = this;
		var treeData = [];
		$.each(data, function(i, row) {
			var text = row.display_name ? row.display_name : row.host;
			var children = false;
			if (count) {
				//	text += '&nbsp;(' + row.learning_so_far + ')';
				if (typeof row.subdomains != "undefined" && row.subdomains != null && row.subdomains.length > 0) {
					children = [];
					$.each(row.subdomains, function (i, subdomain) {
						children.push({text: subdomain, state: {disabled: true}});
					})
				} else {
					children = false;
				}

			}

			var obj = {
				children: children,
				state: {opened: (typeof row.open != "undefined" && row.open) ? true : false},
				text: text,
				data: {type: 'app', host: row.host, count: row.learning_so_far },
				icon: 'tele-icon-app',
				a_attr : {title: text}
			};
			treeData.push(obj);
		});
		return treeData;

	},
	formatDataPages: function (data, i, host, mode) {

		if (!data) {
			return;
		}

		var that = this;
		var treeData = [];
		$.each(data, function (i, row) {

			if (typeof(row) == 'object' && !$.isArray(row)) {

				// EXPAND = LEVEL
				var obj = {
					children: that.formatDataPages(row, i, host, mode),
					text: i,
					data: {type: 'dir', text: i},
					icon: 'tele-icon-dir'
				};
				treeData.push(obj);

			} else {
				var childrens = false;
				if (mode != 'page') {
					childrens = [];

					if (row.length == 0) {

						childrens.push({children: false, text: "No parameters", icon: 'tele-icon-param'});

					}
					else {
						$.each(row, function (i, item) {
							childrens.push({
								children: false,
								text: escapeHtml(item),
								icon: 'tele-icon-param',
								// trick to hide the "plus" icon
								li_attr: { "class" : "jstree-leaf" },
								data: {type: 'param', name: escapeHtml(item), host: host}
							});
						});
					}
				}

				var obj = {
					children: childrens,
					text: escapeHtml(i),
					data: {type: 'page', path: row, host: host},
					icon: 'tele-icon-page'
				};
				treeData.push(obj);
			}

		});
		return treeData;

	},
	expand: function(obj, callback) {

		var that = this;

		telepath.ds.get('/applications/get_expand', {
			search: telepath.config.applications.searchString,
			learning_so_far: true,
			sort: telepath.config.applications.sort,
			dir: telepath.config.applications.dir,
			size: 150,
			offset: telepath.config.applications.offset
		}, function (data) {

			var treeData = telepath.config.applications.formatData(data.items.data);

			callback.call(that, treeData);

			// update the offset counter with the new loading
			telepath.config.applications.offset = (data.items.finished) ? 'finished' : telepath.config.applications.offset + data.items.data.length;
			telepath.config.applications.loading = false;
			$(".tele-search-input").attr("disabled", false);
		}, false, false, false);

	},

	//change search icon and get result
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
	data:[],
	reload: function () {

		var that = this;

		// reset the offset count on loading
		that.offset = 0;

		that.appTree = $('<div>');

		that.contentLeftWrap = $('<div>').css({ padding: 0, height: $(that.contentLeft).parent().height() - 20 });
		that.contentLeft.empty().append(that.contentLeftWrap);
		that.contentLeftWrap.append(that.appTree);

		$(that.contentLeftWrap).mCustomScrollbar({
			callbacks: {
				onTotalScroll: function () {

					if (that.loading || that.offset=='finished') {
						return;
					}

					that.loading = true;

					var anotherTree = $('<div>');
					var treedata = telepath.config.applications.expand;

					that.createTree(anotherTree,treedata);
					that.appTree.parent().append(anotherTree);

					$(".tele-search-input").attr("disabled", false);


				}
			},
			scrollButtons: {enable: false},
			scrollInertia: 150,
			onTotalScrollOffset: 200,
			alwaysTriggerOffsets: false,
			advanced: {
				updateOnContentResize: true
			}
		});

		that.data=telepath.config.applications.expand;

		that.createTree(that.appTree,that.data);


	},

	init: function () {
		this.data=null;
		this.initTools();
		$(".tele-config-bar-left .tele-search-input").attr("disabled", true);
		this.reload();
	},
	initTools: function() {

		var that = this;

		// Sort filters
		var sortRadios = $('<div>').radios({
			title: 'Sort By',
			items: [
				//{id: 'host', icon: 'alphabetical-'+(!that.dir?'up':'down'), tip: 'ABC', dir: that.dir },
				{id: 'host', icon: 'alphabetical', tip: 'ABC', dir: that.dir },
				{id: 'learning_so_far', icon: 'bars', tip: 'Count', dir: that.dir }
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

		}});



		// Create
		this.create     = $('<div>').btn({ icon: 'plus', text: 'New', callback: function () {
			telepath.config.application.createApp();
		} });

		this.barLeft.append(this.search).append(this.create);

		var typingTimer;                //timer identifier
		var doneTypingInterval = 1000;

		$(".tele-config-bar-left .tele-search-input").keyup('input', function () {
			clearTimeout(typingTimer);
			if ($(".tele-config-bar-left .tele-search-input").val()){
				typingTimer = setTimeout(function(){
					that.searchString  = $(".tele-config-bar-left .tele-search-input").val();
					that.input();
				}, doneTypingInterval);
			}
		});

		$("#search-button").on("click", function (event) {
			that.searchString = '';
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			that.input();

		});

		if (typeof that.searchString != 'undefined'){
			$(".tele-config-bar-left .tele-search-input").prop("value", that.searchString);
			that.input();
		}
	},
	createTree: function(div,treedata){
		div.jstree({
			core: {data: treedata, progressive_render: true, check_callback: true},
			plugins: ["json_data", "wholerow", "theme", "grid", "contextmenu", "search"],
			contextmenu: {items: telepath.contextMenu},
			grid: {
				columns: [
					{width: $(window).width() < 1200 ? 150 : 320},
					{width: 50, value: "count", cellClass: "learning-so-far"},
					{
						value: function (node) {
							return $('<div>').btn({
								icon: 'edit', callback: function (tree) {
									$nodeParent = tree.element.parents('[role="treeitem"]');
									telepath.config.application.editApp(node.host, $nodeParent);
								}
							});

						}, width: 40
					},
					{
						value: function (node) {
							return $('<div>').btn({
								icon: 'delete', callback: function (tree) {
									$nodeParent = tree.element.parents('[role="treeitem"]');
									telepath.config.application.deleteApp(node.host, $nodeParent)
								}
							});

						}, width: 40
					}
				],
				resizable: true
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
			// console.log('App Changed');
			// console.log(data);
			if(data && data.node) {
				data.instance.element.find('.jstree-wholerow').css('background-color', '');
				data.instance.element.find('.jstree-wholerow-hovered').css("background-color", "rgba(189, 189, 189, 0.85)");
				telepath.config.application.editApp(data.node.data.host);
			}
		}).on('hover_node.jstree',function(e,data){
			$("#"+data.node.id+' .learning-so-far' ).prop('title', 'Overall Transactions');
		});
		/*.on('ready.jstree', function(e, data) {
		 data.instance.search(that.searchString);
		 });*/
	}
};

