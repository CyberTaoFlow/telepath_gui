telepath.search = {

    results: {},
    defaults: {
        'application': true,
        'pages': true,
        'attributes': true,
        'requests': true,
        'suspects': true,
        'alerts': true,
        'cases': true,
        'request_data': true,
        'users': false
    },
    sort: 'date',
    dir: false,
    loading:false,
    selectedTab:false,
    displayed:{
        alerts:[],
        cases:[],
        suspects:[],
        requests:[]
    },

    options: false,
    /*searchTypes: [
        {id: 'cases', label: 'Request Data', desc: 'Search Cases'},					// Scope
        {id: 'alerts', label: 'Applications', desc: 'Search Alerts'},					// Scope
        {id: 'suspects', label: 'Request Data', desc: 'Search suspects'},				// Scope
        {id: 'requests', label: 'Requests', desc: 'Search Requests'},					// Scope
        {id: 'request_data', label: 'Request Data', desc: 'Search request data'}, 	// Variant TODO:: See performance cost to have these on by default
        {id: 'application', label: 'Applications', desc: 'Search domain names'},		// Variant
        {id: 'pages', label: 'Applications', desc: 'Search application page names'},	// Variant
        {id: 'attributes', label: 'Applications', desc: 'Search attribute names'},	// Variant
        {id: 'users', label: 'Request Data', desc: 'Search web application users'},	// Variant
        {id: 'users', label: 'Request Data', desc: 'Search in countries and cities'}	// Variant
    ],*/


    printTypes: function (element) {

        var that = this;

        /*if(!telepath.access.perm.Cases_get|| !telepath.access.admin) {
         that.searchTypes.push({id: 'cases', label: 'Request Data', desc: 'Search Cases' });
         this.defaults.cases=false;
         }


         if (!telepath.access.perm.Alerts_get|| !telepath.access.admin){
         that.searchTypes.push({ id: 'alerts', label: 'Applications', desc: 'Search Alerts' });
         this.defaults.alerts=false;
         }

         if (!telepath.access.perm.Suspects_get|| !telepath.access.admin){
         that.searchTypes.push({ id: 'suspects', label: 'Request Data', desc: 'Search suspects' });
         this.defaults.suspects=false;
         }*/

        if (this.options === false) {
            this.options = this.defaults; // USE $.extend
        }


        /*$.each(that.searchTypes, function (i, data) {

            var wrap = $('<div>').addClass('tele-search-filter').attr('id', 'tele-search-filter-' + data.id);
            //var title = $('<div>').addClass('tele-title-2').html(data.label);

            var cb = $('<div>').addClass('tele-search-filter').teleCheckbox({
                label: data.desc,
                checked: that.options[data.id] ? that.options[data.id] : false,
                callback: function (widget) {

                    that.options[data.id] = widget.options.checked;
                    // console.log(that.options);

                }
            });

            wrap.append(cb);
            element.append(wrap);

        });*/

        that.buttonsEl = $('<div>').addClass('tele-form-buttons');
        that.applyBtn = $('<a href="#" class="tele-button tele-button-apply">Save</a>');
        that.cancelBtn = $('<a href="#" class="tele-button tele-button-cancel">Cancel</a>');

        that.buttonsEl.append(that.applyBtn).append(that.cancelBtn);
        element.append(that.buttonsEl);

        // BIND Validate
        that.applyBtn.click(function () {
            //$('.tele-search-filters').remove();
        });

        // BIND Cancel -- Simply reload
        that.cancelBtn.click(function () {
            that.options = that.defaults; // USE $.extend
            //$('.tele-search-filters').remove();
        });

    },

    searchStr: '',
    init: function (searchStr) {

        this.selectedTab = false;

        this.searchStr = searchStr;

        this.displayed = {
            alerts: [],
            cases: [],
            suspects: [],
            requests: []
        };
        
        this.container = $('.tele-panel-search');
        this.container.empty();

        telepath.activePage = 'search';

        this.initPanel();

    },
    initPanel: function () {

        var that = this;

        // Build UI
        this.panelTopBar = $('<div>').addClass('tele-panel-topbar');
        this.panelTitle = $('<div>').addClass('tele-panel-title');
        this.panelTopBar.append(this.panelTitle);
        this.panelTitle.html('Search results');
        this.container.append(this.panelTopBar);
        this.panelSubBar = $('<div>').addClass('tele-panel-subtitle');
        this.panelTopBarRight = $('<div>').addClass('tele-panel-topbar-right');
        this.panelTopBar.append(this.panelTopBarRight);
        this.container.append(this.panelSubBar);

        // Sort filters
        var sortRadios = $('<div>').radios({
            title: 'Sort By',
            items: [
                {id: 'date', icon: 'time', tip: 'Time', dir: that.dir},
                {id: 'count', icon: 'bars', tip: 'Count', dir: that.dir},
                //{id: 'score', icon: 'alerts', tip: 'Score'}
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

                that.selectedTab = that.tabsEl.tabs( "option", "active" );

                telepath.search.refresh(function () {
                });
            }
        });


        // DateRange
        var filterDateRange = $('<div>').daterange({

            start: telepath.range.start,
            end: telepath.range.end,
            change: function (start, end) {

                telepath.range.start = start;
                telepath.range.end = end;

                //that.boll=false;
                //Reset tab result count to 0
                $('.tele-search-tab span').html('0');
                telepath.search.hardRefresh();

            }
        });

        // Applications
        var filterApps = $('<div>').appSelect({
            callback: function (app_id) {
                $('.tele-icon-application', filterApps).removeClass('tele-icon-application').addClass('tele-icon-loader');
                telepath.search.hardRefresh(function () {
                    $('.tele-icon-loader', filterApps).removeClass('tele-icon-loader').addClass('tele-icon-application');
                });
            }
        });

        // Refresh
        var cmdRefresh = $('<div>').addClass('tele-refresh');
        var cmdRefreshButton = $('<a>').attr('href', '#').addClass('tele-refresh-button').html('&nbsp;');
        cmdRefresh.append(cmdRefreshButton);

        cmdRefreshButton.click(function () {
            if (!telepath.search.loading) {
                var that = this;
                telepath.search.hardRefresh();
            }
        });

        // Append tools
        this.panelTopBarRight.append(sortRadios).append('<div class="tele-navsep"></div>').append(filterDateRange).append('<div class="tele-navsep"></div>').append(filterApps).append('<div class="tele-navsep"></div>').append(cmdRefresh);

        // TABS
        // --------------------------------

        // Tab Containers
        this.tabsEl = $('<div>').addClass('tabs');
        this.tabsUl = $('<ul>');
        this.tabsEl.append(this.tabsUl);

        // Tab Declaration
        var tabs = [
            {id: 'alerts', text: 'Alerts'},
            {id: 'cases', text: 'Cases'},
            {id: 'suspects', text: 'Suspects'},
            {id: 'requests', text: 'Normal'},
        ];

        // Tab Print
        for (x in tabs) {

            var tab = tabs[x];
            var tabEl = $('<div>').attr('id', 'tele-search-' + tab.id);
            // Show Loading
            //tabEl.append('<img class="loader" src="img/loader.gif">');
            var tabLi = $('<li>');
            var tabCount = $('<span>').html('0');
            var tabA = $('<a>').attr('href', '#tele-search-' + tab.id).append(tab.text + '&nbsp;(').append(tabCount).append(')').attr('rel', tab.id).addClass('tele-search-tab');
            tabLi.append(tabA);
            this.tabsUl.append(tabLi);
            this.tabsEl.append(tabEl);

        }

        // Append our tabs
        this.container.append(this.tabsEl);

        this.tabsEl.height(
            $(window).height() -
            $('.tele-header').height() -
            $('.tele-panel-topbar').height() -
            $('.tele-panel-subtitle').height() - 60
        );

        // Init tabs
        this.tabsEl.tabs({

            heightStyle: 'fill',
            autoHeight: false,
            animate: false,
            activate: function (event, ui) {

                // Hook to activate panels and populate data
                var id = ui.newPanel.selector.split('-')[2];
                that.container = $(ui.newPanel.selector);
                // empty container, Yuli
                var teleBlock = $(ui.newPanel.selector + ' .tele-block');
                teleBlock.remove();
                //alert('empty!');
                //that.container.empty();

                switch (id) {

                    case 'cases':
                        that.showCasesTab(ui.newPanel.selector);
                        break;
                    case 'alerts':
                        that.showAlertsTab(ui.newPanel.selector);
                        break;
                    case 'suspects':
                        that.showSuspectsTab(ui.newPanel.selector);
                        break;
                    case 'requests':
                        that.showRequestsTab(ui.newPanel.selector);
                        break;

                }

            },
            create: function (event, ui) {


                // Hook to activate panels and populate data
                /*var id = ui.newPanel.selector.split('-')[2];
                 that.container = $(ui.newPanel.selector);
                 // empty container, Yuli
                 var teleBlock = $(ui.newPanel.selector + ' .tele-block' );
                 teleBlock.remove();*/
            }

        });


        this.tabsEl.tabs({collapsible: true, active: false });

        this.panelSubBar.append(this.tabsUl);

        this.refresh();

    },


    refresh: function () {

        // console.log('Starting Search..');

        if (!this.searchStr){
            $.each(['alerts', 'cases', 'suspects', 'requests'], function (i, type) {
                var container = $('#tele-search-'+type);
                container.empty();
                container.append($('<p>').text("No search string defined"));

            });
            this.tabsEl.tabs({collapsible: false} );
            this.loading= false;
            return false;
        }

        $('.ui-tabs').append(telepath.loader);

        // Cleanup
        var that = this;
        this.results = {};


        // Fallback to defaults
        if (this.options === false) {
            this.options = this.defaults; // USE $.extend
        }

        // Quick country conversion
        //if (telepath.countries.n2a(this.searchStr) != '00') {
        //    this.searchStr = telepath.countries.n2a(this.searchStr);
        //    $('.tele-search-input').val(this.searchStr);
        //    this.countryFlag = true;
        //} else {
        //    this.countryFlag = false;
        //}

        // Collect Settings
        var searchSettingsObj = {
            search: this.searchStr,
            options: this.options,
            // we get this data directly from the server
            //range: telepath.range,
            //apps: telepath.appFilter,
         //   is_country: this.countryFlag,
            sort: this.sort,
            dir: this.dir
        };


        // Loop our types and send out search requests for different types of data

        that.count=0;

        $.each(['alerts', 'cases', 'suspects', 'requests'], function (i, type) {

            if (that.options[type]) {

                telepath.ds.get('/search/' + type, searchSettingsObj, function (data) {
                    // remove loading image, Yuli
                    that.count++;
                    that.container = $('#tele-search-' + type);
                    that.container.empty();
                    if (!data.items.items || data.items.items.length == 0) {
                        var p = $('<p>').text("No results");
                        that.container.append(p);
                        if (that.count==4)
                            that.selectTab();
                        return;
                    }

                    that.results[type] = data.items.items;
                    $('.tele-search-tab[rel="' + type + '"] span').html(thousandsFormat(data.items.total));

                    data.items.items.map(function(a) { that.displayed[type].push(a.sid)});

                    if (that.count==4)
                        that.selectTab();

                }, function (data) {
                    // error handler
                    that.count++;
                    if (that.count==4)
                        that.selectTab();
                    that.container = $('#tele-search-' + type);
                    that.container.empty();
                    var p = $('<p>').text(data['error']);
                    that.container.append(p);
                }, false, true);


            }
            else {
                that.count++;
                if (that.count==4)
                    that.selectTab();
                that.container = $('#tele-search-' + type);
                that.container.empty();
                var p = $('<p>').text("No select option " + type);
                that.container.append(p);
            }

        });

        // Seperate formatter from each panel or make it available globally
        // Properly format the 4 types of data
        // Mark search terms as a listitem widget input
        // Do charts / graphs / maps where acceptable
        // Profit?

    },
    hardRefresh: function(callback){
        deleteCache('telecache');
        this.refresh(callback);
    },

    selectTab: function () {

        var that = this;

        that.loading=false;
        //telepath.loader.remove();
        that.tabsEl.children('.tele-loader').remove();

        var select;

        if (this.selectedTab){
            switch (this.selectedTab) {
                case 0:
                    that.showAlertsTab();
                    break;
                case 1:
                    that.showCasesTab();
                    break;
                case 2:
                    that.showSuspectsTab();
                    break;
                case 3:
                    that.showRequestsTab();
                    break;

            }
            that.tabsEl.tabs({active: that.selectedTab});

            found = true;
        }

        else {

            var found = false;

            $.each(['alerts', 'cases', 'suspects', 'requests'], function (i, type) {

                if (!found) {

                    if (that.results[type] && that.results[type].length > 0) {

                        $('.tele-'+type+'-block').empty();
                        switch (type) {
                            case 'alerts':
                                select = 0;
                                that.showAlertsTab();
                                break;
                            case 'cases':
                                select = 1;
                                that.showCasesTab();
                                break;
                            case 'suspects':
                                select = 2;
                                that.showSuspectsTab();
                                break;
                            case 'requests':
                                select = 3;
                                that.showRequestsTab();
                                break;

                        }
                        that.tabsEl.tabs({active: select});

                        found = true;
                    }
                }
            });
        }


        that.tabsEl.tabs({collapsible: false});
    },

    showCasesTab: function () {

        var that = this;
        // Create List
        this.list = $('<div>').addClass('tele-cases-block');
        $('#tele-search-cases').append(this.list);

        // Init List
        this.list.teleList({
            data: this.results.cases,
            searchkey: this.searchStr,
            formatter: function (item) {

                return telepath.case.rowFormatter(item,'search');

            },

            callbacks: {

                scroll: function (offset, callback) {
                    telepath.ds.get('/search/cases', {
                        search: that.searchStr,
                        options: that.options,
                      //  is_country: that.countryFlag,
                        sort: that.sort,
                        dir: that.dir,
                        displayed: that.displayed.cases
                    }, function (data) {
                        callback(data.items);
                        data.items.items.map(function(a) {
                            that.displayed.cases.push(a.sid);
                            that.results.cases.push(a);
                        });
                    }, false, false, true)
                }
            }
        });
        this._resize('cases');
    },
    showAlertsTab: function () {

        var that = this;

        if (!this.results.alerts)
            return;
        // Create List
        this.list = $('<div>').addClass('tele-alerts-block');
        $('#tele-search-alerts').append(this.list);

        //this.list.teleList({data: this.results.alerts, searchkey: this.searchStr});
        // Init List
        this.list.teleList({
            data: this.results.alerts,
            searchkey: this.searchStr,
            formatter: function (item) {

                //item.checkable = true;
                return telepath.alert.rowFormatter(item);

            },
            callbacks: {

                scroll: function (offset, callback) {
                    telepath.ds.get('/search/alerts', {
                        search: that.searchStr,
                        options: that.options,
                     //   is_country: that.countryFlag,
                        sort: that.sort,
                        dir: that.dir,
                        displayed: that.displayed.alerts
                    }, function (data) {
                        data.items.items.map(function(a) {
                            that.displayed.alerts.push(a.sid);
                            that.results.alerts.push(a);
                        });
                        callback(data.items);
                    }, false, false, true)
                }
            }
        });
        this._resize('alerts');
    },
    showSuspectsTab: function () {

        var that = this;

        if (!this.results.suspects)
            return;
        // Create List
        this.list = $('<div>').addClass('tele-suspects-block');
        $('#tele-search-suspects').append(this.list);

        // Init Suspects
        this.list.teleList({
            data: this.results.suspects, searchkey: this.searchStr,
            formatter: function (item) {
                // item.checkable = true;
                return telepath.suspects.rowFormatter(item);
            },

            callbacks: {

                scroll: function (offset, callback) {
                    telepath.ds.get('/search/suspects', {
                        search: that.searchStr,
                        options: that.options,
                     //   is_country: that.countryFlag,
                        sort: that.sort,
                        dir: that.dir,
                        displayed: that.displayed.suspects
                    }, function (data) {
                        data.items.items.map(function(a) {
                            that.displayed.suspects.push(a.sid);
                            that.results.suspects.push(a);
                        });
                        callback(data.items);
                    }, false, false, true)
                }
            }
        });
        this._resize('suspects');
    },
    showRequestsTab: function () {

        var that= this;

        if (!this.results.requests)
            return;
        // Create List
        this.list = $('<div>').addClass('tele-requests-block');
        $('#tele-search-requests').append(this.list);

        // Init Suspects
        this.list.teleList({
            data: this.results.requests, searchkey: this.searchStr,
            formatter: function (item) {
                //   item.checkable = true;
                return telepath.suspects.rowFormatter(item);
            },

            callbacks: {

                scroll: function (offset, callback) {
                    telepath.ds.get('/search/requests', {
                        search: that.searchStr,
                        options: that.options,
                        is_country: that.countryFlag,
                        sort: that.sort,
                        dir: that.dir,
                        displayed: that.displayed.requests
                    }, function (data) {
                        data.items.items.map(function(a) {
                            that.displayed.requests.push(a.sid);
                            that.results.requests.push(a);
                        });
                        callback(data.items);
                    }, false, false, true)
                }
            }
        });
        this._resize('requests');
        //$(window).trigger('resize');
    },

    _resize: function (name) {

        var height = $(window).height();
        var offset = height -
            $('.tele-header').outerHeight() -
            $('.tele-panel-topbar').outerHeight() -
            $('.tele-panel-subtitle').outerHeight();

        $('.ui-tabs-panel .tele-block .tele-list').height(offset - 160);

        $(window).trigger('resize');
        $('#tele-search-'+ name +' .tele-list').mCustomScrollbar('update');

    }

}
