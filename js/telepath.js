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



                telepath.dashboard.init();
                $('.tele-nav-dashboard a').addClass('active');

                // check if there is an anchor in URL, to display a specific alert on loading
                if (location.hash) {
                    var params = location.hash.split("/");
                    var alerts = [];
                    alerts["key"]=decodeURIComponent(params[2]);
                    telepath.sessionflow.init(params[0].substr(1), params[1], alerts, "alert", "");
                }



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

        $('.tele-panel-dashboard').addClass('active');

        telepath.activePage = 'dashboard';

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


    }

}
