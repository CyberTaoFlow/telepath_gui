$.fn.h = function () {
    this.hover(function () {
        $(this).addClass('hover');
    }, function () {
        $(this).removeClass('hover');
    });
    return this;
};

telepath.loader = '<div class="tele-loader"></div>';

telepath.autocomplete = {
    disabled: false,
    appendTo: 'body',
    position: 'top',
    offset: 0,
    get: function (element, type, value) {

        var that =this;
        $('.tele-loader', element.parent()).remove();
        if (!this.offset){
            $('.tele-autocomplete-select', 'body').remove();
        }

        this.type = type;
        this.value = value;

        if (this.disabled) {
            return;
        }

        if (typeof(value) == 'undefined') {
            value = $(element).val();
            if (value == '' || value == 'All') {
                $(element).attr('placeholder', 'All');
                $(element).data('tele-select', {});
                //return;
            }
        }
        this.value = value;
        
        $(element).css({backgroundColor: '#cecece'});
        element.parent().append(telepath.loader);

        // console.log('Seeking autocomplete of type ' + type + ' value ' + value);

        this.url = '';
        switch (type) {
            //not used
            case 'page':
                this.url = '/applications/get_autocomplete_page';
                break;
            //not used
            case 'application':
                this.url = '/applications/get_autocomplete';
                break;
            case 'subdomain':
                this.url = '/applications/get_subdomain_autocomplete';
                break;
            case 'action':
                this.url = '/actions/get_action_autocomplete';
                break;

        }

        telepath.ds.get(this.url, {text: this.value, offset: this.offset }, function (data) {
            $('.tele-loader', element.parent()).remove();
            $(element).css({backgroundColor: 'white'});
            if (data.items) {
                that.offset += data.items.length;
                telepath.autocomplete.render(element, data.items);
            }
        }, 'Failed autocomplete', false, true);

    },
    render: function (element, items) {

        var that = this;
        var container = element.parent();
        var resultsEl = $('<div>').addClass('tele-autocomplete-select');
        var offset = element.offset();
        $('.tele-autocomplete-select .tele-loader').remove();
        this.loading = false;

        $('body').click(function (e) {
            if ($(e.target).parents('.tele-autocomplete-select').size() == 0) {
                $('.tele-autocomplete-select').remove();
            }
        });
        if (this.offset == items.length) {
            $('.tele-autocomplete-select', 'body').remove();

            if (this.appendTo == 'body') {
                resultsEl.css({
                    position: 'absolute',
                    top: offset.top + 24,
                    left: offset.left,
                    width: element.outerWidth() - 2
                }).appendTo(this.appendTo);
            }
            else if (this.position == 'bottom') {
                resultsEl.css({
                    position: 'absolute',
                    bottom: $(window).height() - offset.top,
                    left: offset.left - $(this.appendTo).offset().left,
                    width: element.outerWidth() - 2
                }).appendTo(this.appendTo);
            } else {
                resultsEl.css({
                    position: 'absolute',
                    bottom: offset.top - $(this.appendTo).offset().top,
                    left: offset.left - $(this.appendTo).offset().left,
                    width: element.outerWidth() - 2
                }).appendTo(this.appendTo);
            }

            resultsEl.mCustomScrollbar({
                callbacks: {
                    advanced: {
                        updateOnContentResize: true
                    },
                    onTotalScrollOffset: 200,
                    alwaysTriggerOffsets: false,
                    scrollInertia: telepath.scrollSpeed,
                    onTotalScroll: function () {

                        if(that.loading) {
                            return;
                        }
                        that.loading = true;

                        resultsEl.append(telepath.loader);
                        telepath.ds.get(that.url, {text: that.value, offset: that.offset }, function (data) {

                            $('.tele-loader', resultsEl).remove();
                            $(element).css({backgroundColor: 'white'});
                            if (data.items.length) {
                                that.loading=  false;
                                that.offset += data.items.length;
                                $.each(data.items, function (i, item) {

                                    that.appendItem(element, resultsEl, item);
                                });
                                $('.tele-autocomplete-select').mCustomScrollbar('update');
                            }
                        }, 'Failed autocomplete', false, true);
                    }
                }
            });
        }

        resultsEl = $('.tele-autocomplete-select .mCSB_container');

        $.each(items, function (i, item) {
            that.appendItem(element, resultsEl, item);
        });

        $('.tele-autocomplete-select').mCustomScrollbar('update');
    },

    appendItem: function(element, container, item){
        var resultEl = $('<div>').addClass('tele-autocomplete-item')
            .text(item.key)
            .data('tele-select', item)
            .attr('title', item.key)
            .hover(function () {
                $(this).addClass('hover');
            }, function () {
                $(this).removeClass('hover');
            });

        if (item.root) {
            resultEl.addClass('rootdomain');
        } else {
            resultEl.addClass('subdomain');
        }

        resultEl.click(function () {
            telepath.autocomplete.disabled = true;
            element.val(item.key);
            element.data('tele-select', item);
            $('.tele-autocomplete-select', 'body').remove();
            setTimeout(function () {
                telepath.autocomplete.disabled = false;
            }, 1500);
            $(element).parents('.tele-multi').data('tele-teleSelect').options.click();
            // Lookup another event listener

        }).h();
        container.append(resultEl);
    }
};

$.widget("tele.teleSelect", {
    items: [],
    result: function () {

        var result = [];
        $('.tele-multi-input input', this.element).each(function () {
            result.push($(this).data('tele-select'));
        });
        return result;

    },
    options: {
        type: 'application',
        constrain: 5,
        appendTo: 'body',
        position: 'top',
        click: function () {

        },
        template: function (element, value) {

            element.addClass('tele-multi-input');

            telepath.autocomplete.appendTo = this.appendTo;
            telepath.autocomplete.position = this.position;
            telepath.autocomplete.offset = 0;

            var that = this;
            var input = $('<input>');


            if (value.text == 'All') {
                input.attr("placeholder", value.text);
            }
            else {
                input.val(value.text);
            }

            input.data('tele-select', value);

            var dd_arrow = $('<div>');

            element.append(input);
            element.append(dd_arrow);

            input.on('keypress', function () {
                if (window.autocompleteTimer) {
                    clearTimeout(window.autocompleteTimer);
                }
                window.autocompleteTimer = setTimeout(function () {
                    telepath.autocomplete.offset = 0;
                    telepath.autocomplete.get(input, that.type);
                }, 500);
                value.text = input.val();
                input.data('tele-select', value);
            });
            input.on('change', function () {
                if (window.autocompleteTimer) {
                    clearTimeout(window.autocompleteTimer);
                }
                window.autocompleteTimer = setTimeout(function () {
                    telepath.autocomplete.offset = 0;
                    telepath.autocomplete.get(input, that.type);
                }, 500);
                value.text = input.val();
                input.val('');
                input.data('tele-select', value);
            });

            input.on('click', function () {
                if ($(this).val() == 'All') {
                    $(this).select();
                    setTimeout(function () {
                        telepath.autocomplete.offset = 0;
                        telepath.autocomplete.get(input, that.type, '');
                    }, 500);
                } else {
                    setTimeout(function () {
                        telepath.autocomplete.offset = 0;
                        telepath.autocomplete.get(input, that.type);
                    }, 500);
                }
            });

            dd_arrow.on('click', function () {
                input.trigger('click');
            });

        },
        values: []
    },
    _create: function () {
        this.element.addClass("tele-multi");
        this._update();
    },
    _setOption: function (key, value) {
        this.options[key] = value;
        this._update();
    },
    _update: function () {

        // Init
        var that = this;

        var tpl_add = '';
        var tpl_close = '';

        if (this.options.label) {
            var label = $('<div>').addClass('tele-label').html(this.options.label);
            this.element.append(label);
        }

        if (this.options.values) {

            $.each(this.options.values, function (i, val) {

                var container = $('<div>').addClass('tele-multi-value');
                var controls = $('<div>').addClass('tele-multi-control');
                var cmd_delete = $('<div>').addClass('tele-icon tele-icon-minus').html(tpl_close).h();
                var el = $('<div>');

                that.options.template(el, val);

                cmd_delete.click(function () {
                    container.remove();
                    that.constrain();
                });

                controls.append(cmd_delete);
                container.append(el).append(controls);

                that.element.append(container);

                that.items.push(container);

            });
        }

        var container = $('<div>').addClass('tele-multi-value');
        var controls = $('<div>').addClass('tele-multi-control');
        this.cmd_create = $('<div>').addClass('tele-icon tele-icon-plus').html(tpl_add).h();

        controls.append(this.cmd_create);
        container.append(controls);
        that.element.append(container);

        this.cmd_create.click(function () {

            var container = $('<div>').addClass('tele-multi-value');
            var controls = $('<div>').addClass('tele-multi-control');
            var cmd_delete = $('<div>').addClass('tele-icon tele-icon-minus').html(tpl_close).h();

            var el = $('<div>');
            that.options.template(el, {text: '', root: true});

            controls.append(cmd_delete);

            cmd_delete.click(function () {
                container.remove();
                that.constrain();
            });

            container.append(el).append(controls);

            that.cmd_create.parent().parent().before(container);

            that.constrain();

        }).h();

        $('.tele-icon', this.element).h();

    },
    constrain: function () {

        if ($('.tele-multi-value', this.element).size() > this.options.constrain) {
            this.cmd_create.hide();
        } else {
            this.cmd_create.show();
        }

        if ($('.tele-multi-value', this.element).size() < 2) {
            this.cmd_create.click();
        }

    }

});