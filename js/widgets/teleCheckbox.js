$.widget( "tele.teleCheckbox", {
 
    // Default options.
    options: {
		'label': false,
		'checked': false,
		'icon': 'checkbox',
		'inputFirst': true,
		'dataID': false,
		'dropBoxes': false
    },
    _create: function() {
        this.element.addClass( "tele-checkbox" );
        this._update();
    },
 
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        this._update();
    },
 
    _update: function() {
		
		var that = this;
		this.element.empty();
		
		this.input = $('<div>').addClass('tele-checkbox-' + this.options.icon);
		
		// Append input first
		if(this.options.inputFirst) {	
			this.element.append(this.input);
		}
		
		if(this.options.dataID) {
			this.input.attr('dataID', this.options.dataID);
		}
		
		// Append label
		if(this.options.label) {
			this.label = $('<label>').addClass('tele-input-label').html(this.options.label);
			this.element.append(this.label);
		} else {
			this.element.addClass('no-label');
		}
		
		// Append input last
		if(!this.options.inputFirst) {	
			this.element.append(this.input);
		}
		
		if(this.options.checked) {
			this.input.addClass('checked');
		}else{
			this.input.removeClass('checked');
		}

		// Add boxes to drop items
		if (this.options.dropBoxes) {
			$.each(this.options.dropBoxes, function (i, val) {
				var dropBox = $('<div>').addClass('tele-drop').on({
					drop: function (ev) {
						ev.preventDefault();
						// Allow only one item in each box
						if ($(this).children().length) {
							return;
						}
						// Get dropped item inner text
						var data = ev.originalEvent.dataTransfer.getData("text");
						// Create draggable span with the text
						var span = $('<span>').text(data).uniqueId().attr('draggable', 'true').on('dragstart', function (ev) {
							ev.originalEvent.dataTransfer.setData("text", ev.target.id);
						});
						$(ev.target).append(span);

					}, dragover: function (ev) {
						ev.preventDefault();
					}
				});
				// If there is data sored in DB, we need to display it within the boxes
				if (val) {
					var span = $('<span>').text(val).uniqueId().attr('draggable', 'true').on('dragstart', function (ev) {
						ev.originalEvent.dataTransfer.setData("text", ev.target.id);
					});
					dropBox.append(span);
				}
				that.element.append(dropBox);
			});
		}

		
		this.input.click(function () {
			
			if(that.options.checked) {
				$(this).removeClass('checked');
			} else {
				$(this).addClass('checked');
			}
			that.options.checked = !that.options.checked;
			
			if(that.options.callback) {
				that.options.callback(that);
			}
			
		});
		
    }

});