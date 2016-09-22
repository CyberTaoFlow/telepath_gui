$.widget( "tele.teleList", {
 
    // Default options.
	toggleAll: function(value) {
			
		$.each(this.items, function(i, item) {
			var widget = $(item).listitem("option", "checked", value);
			
		});
			
	},
	getSelected: function() {
	
		var selected = [];
		$.each(this.items, function(i, item) {
			var widget  = $(item).data('tele-listitem');
			var checked = widget.options.checked;
			if(checked) {
				selected.push(widget.options.dataID);
			}
		});
		
		return selected;
	
	},

	filter: function(value){



		$.each(this.items, function(i, item) {
			if ($(item).data('tele-listitem').options.title == value){
				$(item).toggle();
			}
		});
	},
    options: {
		title: false,
		titleCallback: false,
		data: false,
		formatter: false,
		searchkey: '',
		clickable: true,
		callbacks: {}
    },
    _create: function() {
		
		var that = this;
		
	        this.element.addClass( "tele-block" );
		
		if(this.options.title) {
			
			this.title = $('<div class="tele-block-title">').html(this.options.title);
			this.element.append(this.title);
			
			if(typeof(this.options.titleCallback) == 'function') {
				this.title.css({ cursor: 'pointer' }).click(this.options.titleCallback);
			}
			
		} else {
			
			this.element.addClass( "no-title" );
			
		}
		
		this.list = $('<ul class="tele-list">');
		if(this.options.height) {
			this.list.css({ height: this.options.height });
		}

		this.element.append(this.list);
		
		this._update();
		
		/*
		$(this.element).on('resize', function () {
			$(that.items).each(function (i, item) {
				//$(item).resize();
			});
		});
		*/
		
    },
 
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        this._update();
    },
	appendItem: function(item) {
		
		var that = this;
		
		// Create Element
		var newItem = $('<li>');
		
		if($('.mCSB_container', that.list).size() > 0) {
			$('.mCSB_container', that.list).append(newItem);
		} else {
			that.list.append(newItem);
		}
		
		
		// Item Formatting
		var formattedItem = that.options.formatter(item);
		
		// Hook click Callback
		formattedItem.callback = that.options.callbacks.click;
		
		if(typeof(that.options.callbacks.favorite) == 'function') {
			// Hook fav Callback
			formattedItem.favoriteCallBack = that.options.callbacks.favorite;
		}
		
		// Create List Item
		newItem.listitem(formattedItem);

		
		// Hook hover Callbacks
		$('.tele-listitem-icon, .tele-listitem-progbar, .tele-listitem-count', newItem).hover(function () {
			$('.popover').remove();
			if(that.timer) {
				clearTimeout(that.timer);
			}
			if($(this).hasClass('tele-listitem-count')){
				var el=$(this).prev();
			}
			else{
				var el = this;
			}
			that.timer = setTimeout(function () {
				that.options.callbacks.hover_in(el, $(el).data('formattedItem'));
			}, 500);
		}, function () {
			if(that.timer) {
				clearTimeout(that.timer);
			}
			that.options.callbacks.hover_out(this, formattedItem);
		}).data('formattedItem',formattedItem);

		if(this.options.clickable){
			$('.tele-listitem-info li b, .tele-country, .tele-user', newItem).css('cursor','url(img/search_icon.png), pointer');

			$('.tele-listitem-info li b, .tele-country, .tele-user', newItem).hover(function(){
				$(this).css('color','#4174a7');
			},function(){
				$(this).css('color','#333333');
			});

            $('.tele-listitem-info li b, .tele-country, .tele-user', newItem).click(function () {

                var search = $(this).text();

                var field = '';

                // check if displayed field name (before ":")
                if ($(this).parent().text().indexOf(":") > -1) {
                    field = $(this).parent().text().split(/\s{1}/)[0];

                    // change field to elastic field name
                    switch (field) {
                        case "IP:":
                            field = 'ip_orig:';
                            break;
                        case "rules:":
                            field = 'alerts.name:';
                            break;
						case "country:":
							$.each(telepath.countries.map, function (k, val) {
								if (val.toLowerCase() == search.toLowerCase()) {
									search = k;
								}
							});
                            field = 'country_code:';
                            break;
						case "application:":
                            field = 'host:';
                            break;
						case "parameter:":
                            field = 'parameters.name:';
                            break;
                    }
                }
                // user and country fields
                else {
                    if ($(this).attr("class") == 'tele-user') {
                        field = 'username:';
                        search = $.trim(search);
                    }
                    else {
                        $.each(telepath.countries.map, function (k, val) {
                            if (val.toLowerCase() == search.toLowerCase()) {
                                search = k;
                            }
                        });
                        field = 'country_code:';
                    }
                }

                telepath.header.searchInput.val(field + '"' + search + '"');
                telepath.search.init(field + '"' + search + '"');
            });
        }
		
				// Append to local Store
		that.items.push(newItem);
		
	},
    _update: function() {
		
		var that = this;
		
		this.items = [];
		
		if(!this.options.callbacks.hover_in) {
			this.options.callbacks.hover_in = telepath.listitem.generic.callbacks.hover_in;
		}
		if(!this.options.callbacks.hover_out) {
			this.options.callbacks.hover_out = telepath.listitem.generic.callbacks.hover_out;
		}
		if(!this.options.callbacks.click) {
			this.options.callbacks.click = telepath.listitem.generic.callbacks.click;
		}
		
		if(!this.options.formatter) {
			this.options.formatter = telepath.listitem.generic.formatter;
		}
		
		for(x in this.options.data) {
			var item = this.options.data[x];
			item.searchkey = this.options.searchkey;
			this.appendItem(item);
		}

		$(this.list).mCustomScrollbar({
	
			callbacks:{
				onTotalScroll:function(){
					
					if(that.loading) {
						return;
					}
				
					that.loading = true;
					
					$('.mCSB_container', that.list).append($(telepath.loader).css({ float: 'left', clear: 'both', 'bottom': 30, position: 'absolute' }));
					
					if(typeof(that.options.callbacks.scroll) == 'function') {
						that.options.callbacks.scroll(that.items.length, function (data) {
							
							that.loading = false;
							$('.tele-loader', that.list).remove();
							
							for(x in data.items) {
								var item = data.items[x];
								item.searchkey = that.options.searchkey;
								that.appendItem(item);
							}
							
						});
					}
				},
			},
			onTotalScrollOffset:200,
			alwaysTriggerOffsets:false,
			advanced:{ updateOnContentResize:true }

		});

		$(this.list).trigger('teleList.afterUpdate');
		
    }

});
