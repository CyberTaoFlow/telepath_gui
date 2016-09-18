$.widget('tele.teleOption', {
    options: {
        label: '',
        selected: '',
        options: [],
        appendTo: 'none',
        css:'none'
    },
    _create: function () {
        this.element.addClass("tele-dropdown-options");
        this._update();
    },

    _setOption: function (key, value) {
        this.options[key] = value;
        this._update();
    },
    _update: function () {

        var that = this;

        this.element.empty();

        if (that.options.css != 'none') {
            this.element.css(that.options.css);
        }


        if (that.options.appendTo != 'none') {
            $(that.options.appendTo).append(this.element);
        }


        if (this.options.label) {
            var label = $('<span>').html(that.options.label).addClass('tele-title-option');

            label.css({'position': 'absolute', 'visibility': 'hidden'});

            $('body').append(label);

            that.titleWidth = label.width();

            $(label, 'body').remove();

            label.removeAttr('style');

            that.element.append(label)
        }
        var select = $('<span>').addClass('tele-dropbtn');

        if (that.options.selected == '') {
            that.options.selected = that.options.options[0];
        }

        var caret = $('<span>').addClass('caret');

        select.append(caret);

        select.append('<span class="text-button">' + this.options.selected + '</span>');

        var options = $('<div>').addClass('tele-dropdown-content');

        this.element.append(label);

        options.css({"left": this.titleWidth + 15});

        $.each(this.options.options, function (i, opt) {
            var selected = that.options.selected == opt ? 'selected' : '';
            options.append('<a ' + selected + ' value="' + opt + '">' + opt + '</a>');
        });

        if (this.options.options.length > 5){
            options.css({'border-radius': '10px'})
        }

        options.hide();

        this.element.append(select).append(options);

        select.click(function () {
            options.toggle();
        });

        $('body').click(function (e) {
            if ($(e.target).parents('.tele-dropdown-options').size() == 0) {
                $('.tele-dropdown-content').hide();
            }
        });


        $('a', options).click(function () {
            $('.text-button', select).remove();
            var selected = $(this).html();
            select.append('<span class="text-button">' + selected + '</span>');
            that.options.selected =  selected;

        });


    }
});