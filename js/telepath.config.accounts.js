telepath.config.accounts = {
	selectedGroup: 'All',
	editGroup: function (group_id) {
		
		var that = this;
		
		telepath.ds.get('/groups/get_group', { id: group_id }, function (data) {

			data = data.items;
			that.showGroup(data);

		});
		
	},
	showGroup: function(data) {
		
		var that = this;

		that.contentRight.empty();
		that.data = data;
		
		that.groupInputs = $('<div>').addClass('group-input')
		that.groupName = $('<div>').teleInput({ label: 'Group name', value: data.group.name });
		that.groupDesc = $('<div>').teleInput({ label: 'Group description', value: data.group.description });
		
		that.groupInputs.append(that.groupName);
		that.groupInputs.append(that.groupDesc);
		
		that.contentRight.append(that.groupInputs);
		
		var btnContain = $('<div>').addClass('tele-button-container-group');
		var saveBtn   = $('<a class="tele-button tele-button-apply">Save</a>');
		var cancelBtn  = $('<a class="tele-button tele-button-cancel">Cancel</a>');
		
		cancelBtn.click(function () {
			that.getUsers();
		});

		btnContain.append(saveBtn).append(cancelBtn);
		
		// Apps limit
		var apps_data = [];
		$.each(that.data.apps, function(i, app) {
			apps_data.push({ text: app });
		});
		
		that.limitApps = $('<div>').teleSelect({ type: 'subdomain', values: apps_data, click: function () { } }).hide();
		that.limitRanges = $('<div>').addClass('tele-limit-ranges-group').hide();
	
		that.toggleType = $('<div>').teleRadios({
			title: 'Configure applications access limits',
			radios: [ 
			{ key: 'none',   label: 'None', 			  checked: that.data.apps.length == 0 && that.data.ranges.length == 0 }, 
			{ key: 'ranges', label: 'IP Ranges', 		  checked: that.data.apps.length == 0 && that.data.ranges.length > 0 },
			{ key: 'hosts',  label: 'Specific hostnames', checked: that.data.apps.length > 0 && that.data.ranges.length == 0 },
			], callback: function(radio) {
			
			that.limitApps.hide();
			that.limitRanges.hide();
			
			switch(radio.key) {
				case 'none':
				break;
				case 'ranges':
					that.limitRanges.show();
				break;
				case 'hosts':
					that.limitApps.show();
				break;
			}
			
			// console.log();
			
		}}).addClass('tele-limit-type-group');
		
		that.contentRight.append(that.toggleType);

		that.containerLimits =$('<div>').addClass('container-limits');
		that.contentRight.append(that.containerLimits);
		that.containerLimits.append(that.limitApps);

		that.permissions = $('<div>').addClass('tele-group-permissions').append('<div class="tele-title-1">Permissions</div>');

		// Create tabs UI
		that.perm_tabs   = $('<div>').addClass('tele-perm-tabs');
		that.tabsEl = $('<div>').addClass('tabs');
		that.tabsUl = $('<ul>');
		that.perm_tabs.append(that.tabsUl).append(that.tabsEl);
		
		// Define tab headers
		var tabs = [
			{ id: 'get', text: 'Retrieve' },
			{ id: 'set', text: 'Modify' }
		];
		
		// Populate headers and create content divs
		for(x in tabs) {
			var tab = tabs[x];
			var tabEl = $('<div>').attr('id', 'tele-perm-' + tab.id);
			var tabLi = $('<li>');
			var tabA  = $('<a>').attr('href', '#tele-perm-' + tab.id).text(tab.text);
			tabLi.append(tabA);
			that.tabsUl.append(tabLi);
			that.tabsEl.append(tabEl);
			
		}
		
		telepath.ds.get('/permissions/get_list', { }, function (data) {
			
			$.each(data.items, function (i, row) {
				
				var checked = false;
				$.each(that.data.perm, function (i, perm) {
					if(perm.id == row.id) {
						checked = true;
						return false;
					}
				});
								
				var cb = $('<div>').teleCheckbox({
				checked: checked,
				label: row.description,
				dataID: row.id,
				callback: function (el, v) {}
				});
				
				$('#tele-perm-' + row['function']).append(cb);
				
				//that.permissions.append(cb);
			
			});
			
			that.perm_tabs.tabs({ 
				activate: function( event, ui ) {	
				}
				
			});
			
		});

		that.permissions.append(that.perm_tabs);
		that.contentRight.append(that.permissions);

		// Load provided by settings

		if(that.data.ranges.length){
			// Load provided by settings
			$.each(that.data.ranges, function (i, ip) {
				that.limitRanges.append(getRangeUI(ip));
			});
		}
		//else get empty range
		else{
			that.limitRanges.append(getRangeUI(''));
		}

		// Another blank
		that.limitRanges.append(getRangeUI('last'));
		
		that.containerLimits.append(that.limitRanges);



		that.contentRight.mCustomScrollbar({
			scrollInertia: 150,
			advanced: {
				updateOnContentResize: true,
				autoScrollOnFocus: false
			}
		});

		that.contentRight.append(btnContain);

		this.resizeLayout();
		// telepath.ds.get('/permissions/get_list', { }, function (data) {
						
		// 	$.each(data.items, function (i, row) {
				
		// 		var checked = false;
		// 		$.each(that.data.perm, function (i, perm) {
		// 			if(perm.id == row.id) {
		// 				checked = true;
		// 				return false;
		// 			}
		// 		});
				
		// 		var cb = $('<div>').teleCheckbox({
		// 		checked: checked,
		// 		label: row.description,
		// 		dataID: row.id,
		// 		callback: function (el, v) {}
		// 		});
				
		// 		that.permissions.append(cb);
			
		// 	});
		// });
		
		// that.contentRight.append(that.permissions);
		
		// Save function 
		
		saveBtn.click(function () {
			
			var groupData = { group: {}, perm: [], apps: [], ranges: [] };
			
			groupData.group.id   = data.group.id;
			groupData.group.name = $('input', that.groupName).val();
			groupData.group.description = $('input', that.groupDesc).val();
			groupData.mode = $('.tele-radio-knob', that.toggleType).parent().attr('rel');
			
			$('.tele-group-permissions .tele-checkbox-checkbox.checked').each(function () { 
				groupData.perm.push($(this).attr('dataid')); 
			});
			
			switch(groupData.mode) {
			
				case 'hosts':
					
					result = '';
					$('input', that.limitApps).each(function () {
						groupData.apps.push($(this).val().trim());
					});
				
				break;
				case 'ranges':

					$(".tele-ip-segment.error").removeClass('error');
					var checkIPS = false;

					$('.tele-ip-wrap', that.limitRanges).each(function () {

						if ($('.tele-mini-toggle', this).data('tele-toggleFlip')) {

							var is_range = $('.tele-mini-toggle', this).data('tele-toggleFlip').options.flipped;
							var ip_start = $('.tele-ip:first', this).data('tele-ip').getIP();
							var ip_end = $('.tele-ip:last', this).data('tele-ip').getIP();

							if (is_range) {
								if (ip_start && ip_end && ip2long(ip_start) < ip2long(ip_end)) {
									groupData.ranges.push(ip_start + '-' + ip_end);
								}
								else{
									$('input', this).addClass('error');
									checkIPS = true;
								}
							} else {
								if (ip_start) {
									groupData.ranges.push(ip_start);
								}
								else {
									$('input', this).addClass('error');
									checkIPS = true;
								}
							}
						}

					});

					if (checkIPS){
						telepath.dialog({msg: 'You have entered an invalid IP address!'});
						return
					}
				break;
				
			}
			
			if(groupData.group.id == 'new') {
				
				telepath.ds.get('/groups/add_group', { items: groupData }, function (data) {
					that.loadData();
				});

			} else {
				
				telepath.ds.get('/groups/set_group', { items: groupData }, function (data) {
					that.loadData();
				});
			}
		});
	},
	deleteGroup: function (id) {
		var that = this;
		telepath.ds.get('/groups/del_group', { id: id }, function (data) {
			that.loadData();
		});
	},
	init: function () {
		
		var that = this;
		
		var leftTitle = $('<div>').addClass('tele-panel-subtitle-text').html('Groups');
		var rightTitle = $('<div>').addClass('tele-panel-subtitle-text').html('Users');
		
		this.cmdNewGroup    = $('<div>').btn({ icon: 'plus', text: 'New Group' });
		this.cmdImportGroup = $('<div>').btn({ icon: 'import', text: 'Import Group' });
		this.cmdNewUser     = $('<div>').btn({ icon: 'plus', text: 'New User' });
		
		this.barLeft.append(leftTitle).append(this.cmdNewUser).append(this.cmdNewGroup); // .append(this.cmdImportGroup);
		
		this.cmdDeleteUsers = $('<div>').btn({ icon: 'delete', text: 'Delete', callback: function () {
			var selected = that.list.data('tele-teleList').getSelected();
			var data = telepath.config.accounts.data;
			var to_delete = [];
			var goOut = false;
			$.each(data, function (d_index, d_val) {
				$.each(selected, function (s_index, s_val) {
					if (s_val == that.current_user) {
						goOut = true;
						return
					}
					var user_id = d_val['id'];
					if(s_val == user_id){
						if(d_val['login'] != 'admin'){
							to_delete.push(user_id);
						}else{
							// console.log('Cannot delete admin');
						};
					}
				});
				if (goOut) {
					return
				}
			});
			if (!goOut) {
				telepath.dialog({
					type: 'dialog',
					msg: 'This operation will delete the selected user(s). Are you sure?',
					callback: function () {
						telepath.ds.get('/users/del_user', {id: to_delete}, function (data) {
							that.loadData();
						})
					}
				});
			}
			else {
				telepath.dialog({
					type: 'msg',
					msg: 'Cannot remove logged in user'
				});
			}
		}
		});
	
		this.barRight.append(this.cmdDeleteUsers).append(rightTitle);
		
		this.contentLeft.append(telepath.loader);
		this.contentRight.append(telepath.loader);
		
		this.loadData();
		
		this.cmdNewGroup.click(function () {
			that.showGroup({ group: { id: 'new', name: '', description: '', mode: 'none' }, perm: [], apps: [], ranges: [] });
		});
		
		this.cmdNewUser.click(function () {
			telepath.config.account.init('new', that.contentRight);
			telepath.config.account.showData({ user: { id: 'new', active: true }, perm: [], apps: [], ranges: [], groups: [] });
		});
		
	},
	loadData: function() {
		
		this.getGroups();
		this.getUsers();
	
	},
	getGroups: function() {	
	
		var that = this;
		
		telepath.ds.get('/groups/get_list', { }, function (data) {
			
			that.groups = data.items;
			
			var treeData = [];
			
			treeData.push({ text: 'All', data: {id: 'All', description: '', name: 'All' }, id: 'tele_group_all' });
			
			$.each(data.items, function(i, row) {
				treeData.push({ text: row.name, data: {id: row.id, description: row.description, name: row.name }});
			});
						
			that.groupsTree = $('<div>');
		
			that.groupsTree.jstree({ 'core' : {
				'data' : treeData
			}, 
			plugins: ["grid", "wholerow", "theme"],
			grid: {
				columns: [
					{width: $(window).width() < 1200 ? 220 : 390},
					{value: function (node) {
						
						if(node.name !== 'All') {
						
						return $('<div>').btn({ icon: 'edit', callback: function () {
							
							if(node.name == 'admin') {
								telepath.dialog({ msg: 'Admin is a built in group which cannot be modified.' });
								return;
							}
						
							telepath.config.accounts.editGroup(node.id);
						}});
						
						} else {
							return '';
						}
						
					}, width: 40 },
					{value: function (node) {
						
						if(node.name !== 'All') {
						
						return $('<div>').btn({ icon: 'delete', callback: function () {
							
							if(node.name == 'admin') {
								telepath.dialog({ msg: 'Admin is a built in group which cannot be removed.' });
								return;
							}else{
								telepath.dialog({type: 'dialog', msg: 'This operation will delete the selected group. Are you sure?', callback:function(){
									telepath.config.accounts.deleteGroup(node.id);
								}});
							};
						}});
						
						} else {
							return '';
						}
						
					}, width: 40 }
				],
				resizable:true
			},
			}).on('changed.jstree', function (e, data) {
				data.instance.element.find('.jstree-wholerow').css('background-color', '');
				data.instance.element.find('.jstree-wholerow-hovered').css("background-color", "rgba(189, 189, 189, 0.85)");
				// console.log('Group Changed - ' + data.node.text );
				telepath.config.accounts.selectedGroup = data.node.data.id;
				telepath.config.accounts.getUsers();
			});
			
			that.contentLeft.empty().append(that.groupsTree);
			that.groupsTree.jstree("select_node", "#tele_group_all");
			
		}, 'Error loading group list.');
	
	},
	getUsers: function() {	
	
		var that = this;
		
		telepath.ds.get('/users/get_list', { group: this.selectedGroup }, function (data) {

			that.data = data.items.users;
			that.current_user = data.items.current_user;
		
		// Create List
		that.list = $('<div>');
		that.contentRight.empty().append(that.list);
		
		// Init List
		that.list.teleList({ 
		data: that.data,
		formatter: function(item) {
			
			var title = (item.first_name ? (item.first_name + ' ') : '');
			title    += (item.last_name  ? (item.last_name + ' ') : '');
			title    += (item.login ? ('(' + item.login + ')') : '');
			
			var result = {
				dataID: item.id,
				checkable: true,
				time: item.last_login,
				timeLabel: 'Last Login:',
				icon: 'user',
				title: title,
				count: item.count,
				details: [ 
					{ key: 'Active', value: item.active },
					{ key: 'Email', value: item.email }
				]
			};

			return result;
			
		}, callbacks: {
			click: function (el, id) {
				telepath.config.account.init(el.options.dataID, that.contentRight);
			},
			hover_in: function (el, id) {
				
			},
			hover_out: function (el, id) {

			},
		}});

		}, 'Error loading users list.');	
	
	}
}
