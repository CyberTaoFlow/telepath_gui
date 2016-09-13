telepath.config.webusers = {

    sort: 'user',
    dir: true,
    searchString:'',

    init: function () {

        this.contentEl.empty();

        var rightTitle = $('<div>').addClass('tele-panel-subtitle-text').html('Web Users');

        this.barLeft.append(rightTitle);

        this.contentEl.append(telepath.loader);

        $(".tele-config-bar-left .tele-search-input").attr("disabled", true);

        this.initTools();

    },

    initTools: function(){

        var that = this;

        // Sort filters
        var sortRadios = $('<div>').radios({
            title: 'Sort By',
            items: [
                {id: 'user', icon: 'alphabetical', tip: 'ABC', dir: that.dir },
                {id: 'learning_so_far', icon: 'bars', tip: 'Count', dir: that.dir }
            ],
            selected: this.sort,
            callback: function(e, id) {
                if(that.sort == id) {
                    that.dir = !that.dir;
                }
                $.each(e.options.items, function(i,v){
                    if (v.id==id){
                        e.options.items[i].dir=that.dir;
                    }
                });
                that.sort = id;
                that.init();
            }
        });

        // Search
        this.search = $('<div>').teleSearch({ callback: function (e, txt) {
            that.searchString = txt;
        }});

        this.barLeft.append(this.search);

        var rightPanel=$('<div>').attr('id', 'sort-radio').css('float','right').append(sortRadios);
        $('.tele-panel-topbar').append(rightPanel);


        var input = $(".tele-config-bar-left .tele-search-input");
        input.keyup('input', function (e) {
            if (input.val()) {
                that.searchString = input.val();
            }
            if (e.which == 13) {
                that.loadData()
            }
        });


        if (typeof that.searchString != 'undefined'){
            input.prop("value", that.searchString);
        }

        this.loadData();
    },


    loadData: function() {

        var that = this;

        telepath.ds.get('/webusers/get_users', { search: this.searchString }, function (data) {

            // Create List
            var list = $('<div>');
            that.contentEl.empty().append(list);

            // Init List
            list.teleList({
                data: data.items,
                formatter: function(item) {

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
                            { key: 'host', value: item.host }
                        ]
                    };

                }, callbacks: {
                    click: function (el) {},
                    hover_in: function (el, id) {},
                    hover_out: function (el, id) {}
                }});

        }, 'Error loading users list.');

    }
};