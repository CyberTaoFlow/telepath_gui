$(document).ready(function () {	telepath.register.init(); });

telepath.loader = '<img class="loader" src="img/loader.gif">';

telepath.register = {

    do_registration: function() {

        $('#registration-error').html('').hide();

        // Validate
        if($('#registration-username').val() == '') {
            $('#registration-error').html('Please enter username').show();
            return;
        }
        if($('#registration-password').val() == '') {
            $('#registration-error').html('Please enter password').show();
            return;
        }

        $('.tele-registration').prepend(telepath.loader);

        // Indicator
        var registrationData = {
            username: $('#registration-username').val(),
            password: $('#registration-password').val()
        };

        $.post(telepath.controllerPath + '/auth/register', registrationData, function(result) {

            $('.loader').remove();

            if (result['success']) {
                window.location = telepath.basePath;

                // empty session storage browser cache
                var keys = Object.keys(sessionStorage);
                for (var i = 0; i < keys.length; i += 1) {
                    if (keys[i].indexOf('telecache') === 0) {
                        sessionStorage.removeItem(keys[i]);
                    }
                }

            } else {
                $('#registration-error').html(result['error']).show();
            }

        }, 'json');

    },
    resize: function () {
        $('.tele-container').height($(window).height());
    },
    init: function () {

        // Resize
        $(window).resize(function() {
            telepath.register.resize();
        });
        telepath.register.resize();

        // Enter Key
        $(document).keypress(function(e) {
            if(e.which == 13) { telepath.register.do_registration(); }
        });

        // Registration Send
        $('#registration-button').click(function () { telepath.register.do_registration(); });



    }

};
