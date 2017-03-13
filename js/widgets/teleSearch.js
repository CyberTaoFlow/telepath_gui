$.widget( "tele.teleSearch", {
 
    options: {
		callback: function () {},
		rewrite: false
    },
    _create: function() {
	
        this.element.addClass( "tele-search" );
        this._update();
		
    },
	rewrite: function(text) {
		
		$.each(telepath.countries.map, function (k, val) {
			if(val.toLowerCase() == text.toLowerCase()) {
				text = 'country_code:' + k.toUpperCase();
			}
		});
		
		return text;
	
	},
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        this._update();
    },
 
    _update: function() {
		
		var that = this;
		this.element.empty();
		
		var inputEl  = $('<input type="text">').addClass('tele-search-input');
		if (that.options.firstValue){
			inputEl.val(that.options.firstValue)
		}
		var buttonEl = $('<a>').addClass('tele-search-button').attr('id', 'search-button');
		this.element.append(inputEl).append(buttonEl);

		// Search automatically on every user key up
		if (that.options.autoSearch) {
			var typingTimer;                //timer identifier
			var doneTypingInterval = 1000;

			$(inputEl).keyup(function (e) {
				clearTimeout(typingTimer);
				var term = $(inputEl).val();
				typingTimer = setTimeout(function () {
					that.options.callback(e, term);
				}, doneTypingInterval);
			});

			// Empty input on clear icon click
			this.element.on('click', '.icon-delete-input2', function (e) {
				inputEl.val('');
				that.options.callback(e, '');
			});
		}
		// Standard search on search icon click or 'enter' key press
		else {
			buttonEl.click(function (e) {
				var term = inputEl.val();
				if (term) {
					if (that.options.rewrite) {
						term = that.rewrite(term);
					}
					that.options.callback(e, term);
				}
			});

			$(inputEl).keydown(function (e) {
				if (e.keyCode == 13) {
					var term = inputEl.val();
					if (term) {
						if (that.options.rewrite) {
							term = that.rewrite(term);
						}
						that.options.callback(e, term);
					}
				}
			});

		}


		
    }

});