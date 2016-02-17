$.widget( "tele.teleInput", {
 
    // Default options.
    options: {
		'label': false,
		'value': '',
		'pass': false,
		'labelCSS' : {},
		'link': false,
		'disabled':false
    },
    _create: function() {
        this.element.addClass( "tele-input" );
        this._update();
    },
 
    _setOption: function( key, value ) {
        this.options[ key ] = value;
        this._update();
    },
 
    _update: function() {
		
		var that = this;
		this.element.empty();
		
		if(this.options.label) {
			this.label = $('<label>').addClass('tele-input-label').html(this.options.label);
			this.element.append(this.label);
			this.label.css(this.options.labelCSS);
		}
		
		var tpl = this.options.pass ? ' type="password"' : '';
		
		if(this.options.link) {
			this.link = $('<a>').addClass('tele-input-input').attr('href', this.options.value).attr('target', '_blank').html(this.options.value);
			this.element.append(this.link);
		} else {
			this.input = $('<input' + tpl + '>').addClass('tele-input-input').val(this.options.value);
			if(this.options.disabled)
				this.input.attr('disabled', 'disabled');
			this.element.append(this.input);
		}
		
		
		
		if(this.options.suffix) {
			this.suffix = $('<label>').addClass('tele-input-suffix').html(this.options.suffix);
			this.element.append(this.suffix);
		}
		
		if(this.options.width) {
			this.input.css({ width: this.options.width });
		}
		
    }

});