$(document).ready(function () {

    telepath.main.init();

    $(document).click(function (e) {

        $('.tele-popup').each(function () {

            if($(this).hasClass('hook')) {

                if ($(e.target).parents('.tele-popup').size() == 0 && $(e.target).parents('body').size() > 0 && $(e.target).parents('.tele-autocomplete-select').size() == 0) {
                    $('.tele-popup').remove();
                }

            } else {
                $(this).addClass('hook');
            }

        });

    });

});

telepath.loader = '<img class="loader" src="img/loader.gif">';
telepath.data = {};
telepath.appFilter = [{ key: -1, label: 'All Applications' }];
telepath.scrollSpeed = 300;
/*
 telepath.el_id = 0;
 telepath.next_id = function() {
 telepath.el_id++;
 return telepath.el_id;
 }
 */

telepath.main = {

    init: function () {


        // Load some stuff
        telepath.ds.get('/parameters/get_global_headers', {}, function (data) {
            telepath.global_headers = data.items;
            // console.log('GLOBAL HEADERS::');
            // console.log(telepath.global_headers);
        }, false, false, true);
        telepath.ds.get('/rules/get_cmds', {}, function (data) {
            telepath.rule_cmds = data.items;
            // console.log('CMD EXEC::');
            // console.log(telepath.rule_cmds);
        },false, false, true);


        telepath.ds.get('/telepath/get_app_filter', {}, function (data) {

            telepath.app_filter = data.items;     // console.log('APP FILTER::');     console.log(telepath.app_filter);

            //if (data.ip == '81.218.185.126') {
            //     console.log('DEBUG FROM OFFICE');
            //}

        },false, false, true);
        telepath.ds.get('/telepath/get_time_range', {}, function (data) {
            telepath.range = data.items;
            // console.log('TIME RANGE::');
            // console.log(telepath.range);

        // Load resources

            // var el = $('<div>').teleMulti().addClass('HelloWorld');
            // $('body').append(el);
            // return;

            // Load templates
            $.getJSON(telepath.controllerPath + '/telepath/templates', function (data) {

                telepath.templates = data;
                telepath.ui.init();
                telepath.header.init();
                telepath.ui.choosePage();

                /*
                 var paramBrowse = $('<div>').teleBrowse();
                 $('body').prepend(paramBrowse);
                 */


                //$('.tele-content').append($('<div>').teleBrowse().openbrowser());

                /*setTimeout(function () {
                 $('.tele-nav-cases a').click();
                 $('.tele-panel-topbar .tele-button:first').click()
                 }, 1000);*/
                //telepath.casePanel.init(0);
                //telepath.suspects.init();
                //telepath.alerts.init();
                //telepath.ruleOverlay.addRule();

                // Debug Mode for Application Editor
                /*telepath.config.init();
                 setTimeout(function () {
                 $('.tele-icon-system').click();
                 }, 1500);*/

            });

    }, false, false, true);
        telepath.ds.get('/telepath/get_first_data_time', {}, function(data) {

            // Set global variable to hold the time of the first telepath data
            telepath.fullRangeStart = data.items;

        },false, false, true);
    }

};

telepath.ui = {

    init: function() {

        $('.loader').remove();

        $(window).resize(function () {
            telepath.ui.resize();
        });

        $(window).click(function (e) {
            if($('.popover').size() > 0) {
                if($(e.target).parents('.popover').size() > 0 || $(e.target).hasClass('popover')) {

                } else {
                    $('.popover').remove();
                }
            }
        });

        // Call to function on every hash change
        $(window).on('hashchange', telepath.ui.choosePage);

        var that = this;

        this.mainEl    = $('<div>').addClass('tele-body');
        this.headerEl  = $('<div>').addClass('tele-header');
        this.contentEl = $('<div>').addClass('tele-content');

        this.mainEl.append(this.headerEl).append(this.contentEl);
        $('body').append(this.mainEl);

        this.panels = ['dashboard', 'cases', 'alerts', 'suspects', 'reports', 'config', 'search'];

        $.each(this.panels, function(i, panel) {
            var panelEl = $('<div>').addClass('tele-panel').addClass('tele-panel-' + panel);
            that.contentEl.append(panelEl);
        });


        $(window).resize(function () {
            telepath.ui.resize();
        });

        telepath.ui.resize();

    },
    resize: function () {

        var active = $('.tele-panel.active');
        $.each(this.panels, function(i, x) {
            if($(active).hasClass('tele-panel-' + x)) {
                active = x;
                return false;
            }
        });

        // Containers
        $('.tele-body').height($(window).height());

        if(active == 'dashboard') {
            $('.tele-content').css({ height: '890px' });
            $('body').css({ overflow: 'scroll-x' });
        } else {
            $('.tele-content').css({ height: $(window).height() - $('.tele-header').height() - 50 });

            // remove this because scrolling is not enabled in setting (Moshe)
            //$('body').css({ overflow: 'hidden' });
        }


    },
    displayPage: function(params){

        telepath.activePage = params;

        $('.tele-panel').empty().hide().removeClass('active');
        telepath.header.configCmd.removeClass('active');
        $('.tele-nav a.active').removeClass('active');
        $(".tele-file-upload").hide();

        // If session flow is open
        telepath.overlay.destroy();

        // Specific case is built above the cases panel
        if (params[0] == 'case') {
            $('.tele-panel-cases').show().addClass('active');
            $('.tele-nav-cases  a').addClass('active');
        }

        // Activate the requested panel
        $('.tele-panel-' + params[0]).show().addClass('active');

        // Activate the requested icon between the 4 icons in header (in single case, config and search there is no
        // activated icon)
        if (params[0] != 'case' && params[0] != 'config' && params[0] != 'search') {
            $('.tele-nav-' + params[0] + ' a').addClass('active');
        }

        telepath.ui.resize();

        var hash;
        // Copy the params array to get the session params
        var session = params.slice();
        // For all, we need to remove the first item
        session.shift();

        // Prepare the new hash tag and call the requested init function
        switch (params[0]) {
            // On search, case and config there is a second element. We need to add it to the init call and remove
            // it from the session array to get only the session params
            case 'search':
                hash = 'search/' + encodeURIComponent(params[1]);
                session.shift();
                telepath.search.init(params[1]);
                break;
            case 'case':
                hash = 'case/' + encodeURIComponent(params[1]);
                session.shift();
                telepath.casePanel.init(params[1]);
                break;
            case 'config':
                hash = 'config/' + params[1];
                session.shift();
                telepath.config.init(params[1]);
                break;
            default:
                // Check for an existing function
                if (telepath[params[0]]) {
                    hash = params[0];
                    telepath[params[0]].init();
                }
                else {
                    hash = 'dashboard';
                }
        }

        // Display the session flow if it's requested
        if (session.length) {
            // Display the search filter even if it's not the activated filter
            if (params[0] == 'search'){
                session[2] = params[1];
            }
            telepath.sessionflow.init(session[0], session[1], session[2], '', session[3]);
        }
        else {
            location.hash = hash;
        }

        setTimeout(function () {
            $('.tele-popup, .popover').remove();
        }, 100);

    },
    // Display the page according to the hash tag (default is dashboard) if the requested page is not displayed yet
    choosePage: function () {
        var activePage = location.hash || '#dashboard';
        var params = activePage.substr(1).split("/");

        if (!arrayCompare(params, telepath.activePage)) {
            // Only these parameters can be URL encoded
            if (params[1]) {
                params[1] = decodeURIComponent(params[1]);
            }
            if (params[3]) {
                params[3] = decodeURIComponent(params[3]);
            }
            // check if there is a record in process and stop it
            telepath.config.actions.checkNotFinishedRecord(function () {
                telepath.ui.displayPage(params);
            });
        }
    }

};
