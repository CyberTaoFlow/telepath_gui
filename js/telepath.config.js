telepath.config = {
	
	loaded: false,
	init: function (id) {

		this.outerContainer = $('.tele-panel-config');
		this.initTabs(id);

	},
	initTabs: function(id) {
	
		var that = this;
		// remove canvas for loading map of countries (Yuli)
		$('canvas').remove();	

		this.panelTopBar = $('<div>').addClass('tele-panel-topbar');
		this.outerContainer.append(this.panelTopBar);
		
		this.tabs = [];

		if(telepath.access.admin) {
			this.tabs.push({ icon: 'accounts', text: 'Telepath Users' });
		}
		
		//this.tabs.push({ icon: 'notifications', text: 'Notifications' });
		
		if(telepath.access.admin || telepath.access.perm.Applications_get) {
			this.tabs.push({ icon: 'applications', text: 'Applications' });
		}
		
		if(telepath.access.admin || telepath.access.perm.Rules_get) {
			this.tabs.push({ icon: 'rules', text: 'Rules' });
		}
		
		if(telepath.access.admin || telepath.access.perm.Workflow_get) {
			this.tabs.push({ icon: 'actions', text: 'Business Actions' });
		}

		if(telepath.access.admin || telepath.access.perm.WebUsers_get) {
			this.tabs.push({ icon: 'webusers', text: 'Web Users' });
		}

		if(telepath.access.admin || telepath.access.perm.Config_get) {
			this.tabs.push({ icon: 'system', text: 'Advanced' });
		}

		/*if(telepath.access.admin || telepath.access.perm.LiveSessions_get) {
			this.tabs.push({ icon: 'liveSessions', text: 'Live Sessions' });
		}*/
		
		for(x in this.tabs) {
			var tab   = this.tabs[x];
			tab.callback = function(widget) {

				// check if there is a record in process and stop it
				telepath.config.actions.checkNotFinishedRecord(function(){

					$('.tele-config-tab .active').removeClass('active');
					$('.tele-icon', widget.element).addClass('active');
					$('.tele-button-text', widget.element).addClass('active');

					var id = widget.options.icon;

					that.currentPanel = id;

					// Cleanup container
					that.container.empty();
					$(".tele-file-upload").hide();
					$('#sort-radio').remove();

					// Pass container and shared layout function
					telepath.config[id].container  = that.container;
					telepath.config[id].initLayout = that.initLayout;
					telepath.config[id].resizeLayout = that.resizeLayout;

					// Init Panel
					telepath.config[id].initLayout();
					telepath.config[id].resizeLayout();
					telepath.config[id].init();
					telepath.activePage = ['config', id];
					if (location.hash != '#config/' + id) {
						location.hash = '#config/' + id
					}

					$(window).resize(function () {
						telepath.config[id].resizeLayout();
					});
				});
			};
			var tabBtn = $('<div>').attr('id',tab.icon).btn(tab).addClass('tele-config-tab');
			this.panelTopBar.append(tabBtn);
			this.panelTopBar.append('<div class="tele-navsep"></div>'); // Sep
		}
		
		$('.tele-navsep:last', this.panelTopBar).remove();
		
		this.container = $('<div>').addClass('tele-panel-config-inner');
		this.outerContainer.append(this.container);
		this.container.append(telepath.loader);
		this.start(id);
	},

	// Display the specific tab
	start: function(id) {
		var that = this;
		setTimeout(function () {
			that.container.empty();
			$('#' + id + ' .tele-button-text').trigger('click');
			that.loading = false
		}, 500);
		
	},
	initLayout: function () {
		
		this.barEl		  = $('<div>').addClass('tele-config-bar').addClass('tele-panel-subtitle');
		this.barLeft 	  = $('<div>').addClass('tele-config-bar-left');
		this.barRight 	  = $('<div>').addClass('tele-config-bar-right');
		this.contentEl    = $('<div>').addClass('tele-config-content');
		this.contentLeft  = $('<div>').addClass('tele-config-content-left');
		this.contentRight = $('<div>').addClass('tele-config-content-right');
		/*this.contentRight = $('<div>').addClass('tele-config-content-right').mCustomScrollbar({
			advanced:{ updateOnContentResize: true} });*/
		
		this.barEl.append(this.barLeft).append(this.barRight);
		this.contentEl.append(this.contentLeft).append(this.contentRight);
		
		this.container.append(this.barEl).append(this.contentEl);
		
	},
	resizeLayout: function() {
		
		// console.log('Settings Resize');
		//console.log(this);
		
		this.barEl.css({ height: 40, width: '100%', background: '#333333' });
		
		var height = $(window).height();
		var width  = window.innerWidth;
		var scrollWidth = getScrollBarWidth();
		
		if(width < 1200) {
			
			if(width < 1024) {
				$('.tele-config-tab').css({ margin: '5px 10px 0px 10px' });
			} else {
				$('.tele-config-tab').css({ margin: '5px 20px 0px 20px' });
			}
			
		} else {
			$('.tele-config-tab').css({ margin: '5px 30px 0px 30px' });
		}
		
		$('.tele-body').css({ height: height });
		
		var offset = height - 
					 $('.tele-header').outerHeight() - 
					 $('.tele-panel-topbar').outerHeight() - 
					 $('.tele-panel-subtitle').outerHeight();
		
		$('.tele-panel-config .tele-block').height(offset - 20);
		$('.tele-panel-config .tele-block .tele-list').height(offset - 50);
		$('.tele-list').mCustomScrollbar("update");
		$('.tele-block.no-title').parent().height(offset - 40);

		this.contentEl.css({ height: offset });
		
		if(this.contentRight.hasClass('tele-stacked')) {
			
			this.contentLeft.width(width);
			this.contentRight.width(width -20);
			this.contentRight.css({ height: offset - this.contentLeft.outerHeight() - 160 });
			$('.tele-file-upload').height(offset - this.contentLeft.outerHeight() - 160);
		} else {
		
			var magic = 520;

			if(width < 1200) {
				magic = 350;
			}
			
			this.contentLeft.width(magic);
			this.contentRight.width(width - magic - scrollWidth - 2);
			
			this.contentLeft.css({ height: offset });
			$('.tele-tree', this.contentLeft).css({ height: offset }).mCustomScrollbar("update");
			
			this.contentRight.css({ height: offset -40 });
			$('.tele-rule-editor').css({ height: offset - 197 });

		}

		if ($(this.contentRight).find('.tele-button-container-group').length) {

			this.contentRight.css({height: offset -197});
		}
		
		$('.tele-content').css({ height: $(window).height() - $('.tele-header').height() - 50 });
		this.barLeft.width(magic);
		this.barRight.width(width - magic - scrollWidth - 2);
		
	},
	// return if the search value start with the value
	startsWith2: function(str, prefix) {
		if (str.length < prefix.length)
			return false;
		for (var i = prefix.length - 1; (i >= 0) && (str[i] === prefix[i]); --i) {
			continue;
		}
		return i < 0;
	}
}
