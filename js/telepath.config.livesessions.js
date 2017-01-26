telepath.config.liveSessions = {
    loading: false,
    offset: 0,
    data: [],

    init: function () {
        this.reload();
        this.contentRight.empty();
    },

    reload: function () {

        var that = this;

        // reset the offset count on loading
        that.offset = 0;

        that.appTree = $('<div>');

        that.contentLeftWrap = $('<div>').css({padding: 0, height: $(that.contentLeft).parent().height() - 20});
        that.contentLeft.empty().append(that.contentLeftWrap);
        that.contentLeftWrap.append(that.appTree);

        $(that.contentLeftWrap).mCustomScrollbar({
            callbacks: {
                onTotalScroll: function () {

                    if (that.loading || that.offset == 'finished') {
                        return;
                    }

                    that.loading = true;

                    var anotherTree = $('<div>');
                    var treedata = that.expand;

                    that.createTree(anotherTree, treedata);
                    that.appTree.parent().append(anotherTree);

                    $(".tele-search-input").attr("disabled", false);
                }
            },
            scrollButtons: {enable: false},
            scrollInertia: 150,
            onTotalScrollOffset: 200,
            alwaysTriggerOffsets: false,
            advanced: {
                updateOnContentResize: true
            }
        });

        that.data = this.expand;

        that.createTree(that.appTree, that.data);

    },

    expand: function(obj, callback) {

        var that = this;

        telepath.ds.get('/applications/get_expand', {
            size: 150,
            appsOffset: telepath.config.liveSessions.offset
        }, function (data) {

            var treeData = telepath.config.applications.formatData(data.items.data);

            callback.call(that, treeData);

            // update the offset counter with the new loading
            telepath.config.liveSessions.offset = (data.items.apps_offset == 'finished') ? 'finished' : telepath.config.liveSessions.offset + data.items.data.length;
            telepath.config.liveSessions.loading = false;
            $(".tele-search-input").attr("disabled", false);
        }, false, false, false);

    },

    createTree: function (div, treeData) {

        var that = this;

        div.jstree({
            core: {data: treeData, progressive_render: true, check_callback: true},
            plugins: ["json_data", "wholerow", "theme", "grid", "contextmenu", "search"],
            contextmenu: {items: telepath.contextMenu},
            grid: {
                columns: [
                    {width: $(window).width() < 1200 ? 220 : 400},
                    {width: 50, value: "count", cellClass: "learning-so-far"}
                ],
                resizable: true
            }
        }).on('changed.jstree', function (e, data) {
            if (data && data.node) {
                data.instance.element.find('.jstree-wholerow').css('background-color', '');
                data.instance.element.find('.jstree-wholerow-hovered').css("background-color", "rgba(189, 189, 189, 0.85)");
                that.getSessions(data.node.data.host);
            }
        }).on('hover_node.jstree', function (e, data) {
            $("#" + data.node.id + ' a').prop('title', data.node.text);
            $("#" + data.node.id + ' .learning-so-far').prop('title', 'Overall Transactions');
        });

    },
    getSessions: function (host) {

        var that = this;
        this.contentRight.empty().append(telepath.loader);
        telepath.ds.get('/livesessions/index', {host: host}, function (data) {
            that.data = data.items.items;
            // Create List
            that.list = $('<div>');
            that.contentRight.empty().append(that.list);
            // Init List
            that.list.teleList({
                data: that.data,
                callbacks: {
                    click: function (el) {
                        $('.popover').remove();
                        setTimeout(function () {
                            $('.popover').remove();
                        }, 1000);

                        var parent_parent = el.element.parent().parent();

                        telepath.sessionflow.init(el.options.itemID, 'lastRequest',el.options.raw.searchkey, parent_parent);
                    }
                }
            });
            $(window).trigger('resize');
        }, false, false, false);

    }
};