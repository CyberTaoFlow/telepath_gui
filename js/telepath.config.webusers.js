telepath.config.webusers = {

    sort: 'username',
    dir: true,
    searchString: '',

    init: function () {

        this.contentEl.empty();

        var rightTitle = $('<div>').addClass('tele-panel-subtitle-text').html('Web Users');

        this.barLeft.append(rightTitle);

        this.contentEl.append(telepath.loader);

        $(".tele-config-bar-left .tele-search-input").attr("disabled", true);

        this.initTools();

    },

    initTools: function () {

        var that = this;

        // Sort filters
        var sortRadios = $('<div>').radios({
            title: 'Sort By',
            items: [
                {id: 'username', icon: 'alphabetical', tip: 'Username', dir: that.dir},
                {id: 'last_activity', icon: 'time', tip: 'Time', dir: that.dir},
            ],
            selected: this.sort,
            callback: function (e, id) {
                if (that.sort == id) {
                    that.dir = !that.dir;
                }
                $.each(e.options.items, function (i, v) {
                    if (v.id == id) {
                        e.options.items[i].dir = that.dir;
                    }
                });
                that.sort = id;
                that.loadData();
            }
        });

        // Refresh
        var cmdRefresh = $('<div>').addClass('tele-refresh');
        var cmdRefreshButton = $('<a>').attr('href', '#').addClass('tele-refresh-button').html('&nbsp;');
        cmdRefresh.append(cmdRefreshButton);

        cmdRefreshButton.click(function () {
            that.hardRefresh();
        });

        // Search
        this.search = $('<div>').teleSearch({
            callback: function (e, txt) {
                that.searchString = txt;
            }
        });

        if($(window).width() < 1200) {
            this.barRight.append(this.search);
        }
        else {
            this.barLeft.append(this.search);
        }

        var rightPanel = $('<div>').attr('id', 'sort-radio').css('float', 'right').append(sortRadios).append(cmdRefresh);
        $('.tele-panel-topbar').append(rightPanel);


        var input = $(".tele-config-bar-left .tele-search-input");
        input.keyup('input', function (e) {
            that.searchString = input.val();

            if (e.which == 13) {
                that.loadData()
            }
        });

        $("#search-button").on("click", function () {
            that.loadData();
        });


        if (typeof that.searchString != 'undefined') {
            input.prop("value", that.searchString);
        }

        this.loadData();
    },


    loadData: function () {

        var that = this;

        that.contentEl.empty().append(telepath.loader);

        telepath.ds.get('/webusers/get_users', {
            search: that.searchString,
            sort: that.sort,
            dir: that.dir
        }, function (data) {

            // Create List
            var list = $('<div>');
            that.contentEl.empty().append(list);

            // Init List
            list.teleList({
                data: data.items,
                formatter: function (item) {

                    return {
                        time: item.last_activity,
                        timeLabel: 'Last Activity:',
                        icon: 'webusers',
                        title: item.username,
                        host: item.host,
                        /*progbar: true,
                         progbarValue: item.score *100,
                         raw: item,
                         itemID: item.sid,
                         count: item.total,*/
                        details: [
                            {key: 'host', value: item.host}
                        ]
                    };

                }, callbacks: {
                    scroll: function (offset, callback) {

                        telepath.ds.get('/webusers/get_users', {
                            sort:   that.sort,
                            dir:    that.dir,
                            search: that.searchString,
                            offset: offset
                        }, function (data) {
                            callback(data);
                        }, false, false, true);
                    },
                    click: function (el) {
                    },
                    hover_in: function (el, id) {
                    },
                    hover_out: function (el, id) {
                    }
                }
            });
            $(window).trigger('resize');
        }, 'Error loading users list.', false, true);

    },

    hardRefresh: function () {
        deleteCache('telecache');
        this.loadData();
    }


};