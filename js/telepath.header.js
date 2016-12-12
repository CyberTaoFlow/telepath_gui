
telepath.header = {

	getSearchOpts: function () {
	
	},
	init: function () {

		var that = this;
		// Start Build Header

		// LOGO
		this.logo = '<div class="tele-logo"><img src="img/logo.png" alt="Hybrid Security Telepath" /></div>';

		// NAV
		this.nav = $('<ul>').addClass('tele-nav');
		this.navItems = [
			{id: 'dashboard', label: 'Dashboard'},
			{id: 'cases', label: 'Cases'},
			{id: 'alerts', label: 'Alerts'},
			{id: 'suspects', label: 'Suspects'}
			//{ id: 'reports',   label: 'Reports'   }
		];
		$.each(this.navItems, function (i, item) {
			if (telepath.access.admin || telepath.access.perm[item.label + '_get']) {
				var itemEl = $('<li>').addClass('tele-nav-' + item.id).append($('<a>').attr('href', '#').append('<span class="tele-nav-icon">').append(item.label)); //	
			}
			;

			$(that.nav).append(itemEl);
		});

		// SEARCH -- Perhaps move this code to search panel?

		this.headerRight = $('<div>').addClass('tele-header-right');
		this.search = $('<div>').addClass('tele-search-top');
		this.searchInput = $('<input>').addClass('tele-search-input');
		this.searchIcon = $('<a href="#">').addClass('tele-search-icon').html('Search');
		//this.searchDD = $('<a href="#">').addClass('tele-search-dropdown').html('');

		this.search.append(this.searchInput).append(this.searchIcon)/*.append(this.searchDD)*/;
		this.headerRight.append(this.search);

		// Hook for icon click
		$(this.searchIcon).click(function (e) {
			telepath.config.actions.checkNotFinishedRecord(function(){
				telepath.ui.displayPage('search')
			});
		});

		// Hook for enter key
		$(this.searchInput).keydown(function (e) {
			if (e.keyCode == 13) {
				telepath.config.actions.checkNotFinishedRecord(function(){
					telepath.ui.displayPage('search')
				});
			}
		});

		/*$(this.searchInput).autocomplete({
			source: function(request, response) {
				telepath.ds.get('/search/getAutoComplete', { search: telepath.header.searchInput.val() }, function(data) {
					if(data.items) {
						response(data.items);
					}
				});
			},
			select: function (event, ui){
				if (event.keyCode == 13) {
					return
				}
				telepath.search.init(ui.item.value);
				telepath.ui.resize();
			},
			open: function(event, ui) {
				$(this).autocomplete("widget").css({
					"width": $('.tele-search-top').width()
				});
			},


		}).focus(function () {
			$(this).autocomplete('search', telepath.header.searchInput.val());
		});

		$.ui.autocomplete.prototype._renderItem = function (ul, item) {

			item.label = item.label.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + $.ui.autocomplete.escapeRegex(telepath.header.searchInput.val())
				+ ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<span style='font-weight: normal'>$1</span>");
			return $("<li></li>")
				.data("item.autocomplete", item)
				.append("<a class='text-autocomplete' style='font-weight: bold;  font-family: "+"Roboto Condensed Regular;"+"'>" + item.label +"</a>")
				.appendTo(ul);
		};*/


		// Hook for dropdown arrow
		/*this.searchDD.click(function () {

			if ($('.tele-search-filters').size() > 0) {
				$('.tele-search-filters').remove();
				return;
			}

			that.searchWrap = $('<div>').addClass('tele-search-filters').addClass('tele-popup');

			var title = $('<div>').addClass('tele-title-1').html('What to search');
			that.searchWrap.append(title);
			that.headerRight.append(that.searchWrap);
			telepath.search.printTypes(that.searchWrap);

		});*/

		
		$('.tele-header').append(this.logo).append(this.nav).append(this.headerRight);
		// End Build Header

		// Bind resize event
		$(window).resize(function () { telepath.header.resize(); });
		telepath.header.resize();
		
		// Notifications
		// For now this feature doesn't work
//		this.notifications = $('<div>').notifications();
		
		// Config Button
		this.configDiv = $('<div>').addClass('tele-config');
		this.configCmd = $('<a>').attr('href', '#').addClass('tele-icon').addClass('tele-icon-config');
		this.configDiv.append(this.configCmd);
		
		this.configCmd/*.click(function () {

			// Cleanup other panels
			$('.tele-panel').empty().hide();
			$(".tele-file-upload").hide();
			$('.tele-nav a.active').removeClass('active');
			$('.tele-search-input').val('');

			// Trigger this panel
			var id = 'config';
			telepath[id].init();
			$('.tele-panel-' + id).show();
			$(this).addClass('active');
			telepath.activePage = id;

			// check if there is a record in process and stop it
			telepath.config.actions.checkNotFinishedRecord();
	
		})*/.hover(function () { $(this).addClass('hover'); }, function () { $(this).removeClass('hover'); });
		
		this.logoutCmd = $('<a>').attr('href', '#').addClass('tele-icon').addClass('tele-icon-logout').click(function () {
			
			telepath.ds.get('/auth/logout', {}, function(data) { 
				location.reload(true);
			}, 'Error logging out.');
		
		}).hover(function () { $(this).addClass('hover'); }, function () { $(this).removeClass('hover'); });
		
		// Append
		$('.tele-header-right')/*.append(this.notifications)*/.append(this.configDiv).append(this.logoutCmd);

		$('.tele-logo img, .tele-nav a, a.tele-icon-config').click(function(){

			var id = $(this).parent().attr('class').split('-');
			if(id[0] == 'tele' && id[1] == 'nav' && id[2] != '') {
				id = id[2];
			} else {
				if (id[1] =='config'){
					id = 'config'
				}
				else{
					id = 'dashboard'
				}
			}

			$('.tele-search-input').val('');

			// check if there is a record in process and stop it
			telepath.config.actions.checkNotFinishedRecord(function(){
				telepath.ui.displayPage(id)
			});

		});
		
	},
	resize: function () {
		
		// Nav
		var width = window.innerWidth;
		
		$('.tele-logo').css({ width: 200, overflow: 'hidden' });
		
		if(width < 1300) {
		
			$(this.searchInput).css({ width: 100 });
			
			if(width < 1200) {
				if(width < 800) {
					$('.tele-logo').css({ width: 65, overflow: 'hidden' });
					$('.tele-nav li').css({ margin: '0px 0px' });
				} else {
					$('.tele-nav li').css({ margin: '0px 10px' });
				}
				$('.tele-logo').css({ width: 65 });
			} else {
				$('.tele-nav li').css({ margin: '0px 25px' });
			}
			
		} else {
			$(this.search).css({input:'{padding: 5px 75px 5px 20px}' });
		
			$(this.searchInput).css({ width: 140 });

			$('.tele-nav li').css({ margin: '0px 25px' });
			
		}
		
		var navMargin = (width - $('.tele-header-right').width() - $('.tele-logo').width() - $('.tele-nav').width()) / 2;
		$('.tele-nav').css('marginLeft', navMargin);

		if(width < 801) {
			$('.tele-nav').css('marginLeft', 20);
			$('.tele-panel-subtitle').css('height', '100px !important');
			$('.tele-panel-title').css('position', 'absolute');
		}
		
	}
}