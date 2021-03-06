$.widget("tele.teleInput", {

    // Default options.
    options: {
        'label': false,
        'value': '',
        'pass': false,
        'labelCSS': {},
        'link': false,
        'disabled': false,
        'type': false,
        'range': false,
        'port': null
    },
    _create: function () {
        this.element.addClass("tele-input");
        this._update();
    },

    _setOption: function (key, value) {
        this.options[key] = value;
        this._update();
    },

    _update: function () {

        var that = this;
        this.element.empty();

        if (this.options.label) {
            this.label = $('<label>').addClass('tele-input-label').html(this.options.label);
            this.element.append(this.label);
            this.label.css(this.options.labelCSS);
        }

        var tpl = this.options.pass ? ' type="password"' : '';

        if (this.options.link) {
            this.link = $('<a>').addClass('tele-input-input').attr('href', this.options.value).attr('target', '_blank').html(this.options.value);
            this.element.append(this.link);
        } else if (this.options.type) {
            var type = 'type="' + this.options.type + '" ';
            if (this.options.range) {
                type += 'min="' + this.options.range.min + '" max="' + this.options.range.max + '"';
            }
            this.input = $('<input ' + type + '>').addClass('tele-input-input').val(this.options.value);
            if (this.options.step) {
                this.input.attr('step', this.options.step);
            }
            if (this.options.disabled)
                this.input.attr('disabled', 'disabled');
            this.element.append(this.input);
        } else {
            this.input = $('<input' + tpl + '>').addClass('tele-input-input').val(this.options.value);
            if (this.options.step) {
                this.input.attr('step', this.options.step);
            }
            if (this.options.disabled)
                this.input.attr('disabled', 'disabled');
            this.element.append(this.input);
        }

        if (this.options.port != null) {
            this.port = $('<input>').addClass('tele-input-port').val(this.options.port);
            this.element.append('&nbsp;<b>:</b>&nbsp;',this.port);
        }

        if (this.options.suffix) {
            this.suffix = $('<label>').addClass('tele-input-suffix').html(this.options.suffix);
            this.element.append(this.suffix);
        }

        if (this.options.width) {
            this.input.css({width: this.options.width});
        }
        if (this.options.margintop) {
            this.input.css({'margin-top': this.options.margintop});
        }
       if (this.options.marginleft) {
            this.input.css({'margin-left': this.options.marginleft});
        }
        if (this.options.css) {
            this.element.css(this.options.css);
        }

    }

});