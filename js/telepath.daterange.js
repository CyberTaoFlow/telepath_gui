$.widget( "tele.daterange", {

	// Default options.
	options: {
		start: new Date().getTime(),
		end: new Date().getTime(),
		change: false,
		state:''
	},

	_create: function() {

		this.element.addClass( "tele-daterange" );
		this.createButton();

	},

	_setOption: function( key, value ) {
		this.options[ key ] = value;
		this.createButton();
	},
	_displayPopup: function () {

		var that = this;

		var el = '.tele-daterange:last';
        
		if($(".tele-daterange-popup").css('display') == 'block') {
			$(".tele-daterange-popup").fadeOut();
			return;
		}
		else {
			$(".tele-daterange-popup").remove();
			$('body').append(telepath.templates['popup-daterange']);
		}


		var top  = $(el).offset().top + $(el).height() + 20;
		var left = ($(el).offset().left + ($(el).width() / 2)) - ($(".tele-daterange-popup").width() / 2);

		$(".tele-daterange-popup").css({ top: top , left: left });

		$(".tele-daterange-popup").fadeIn();



		$.datepicker._defaults.dateFormat = "dd/mm/yy";

		$(".tele-daterange-calendar").datepicker({
			//minDate: 0,
			numberOfMonths: [1,2],
			beforeShowDay: function(date) {
				if($(".tele-daterange-from").val()){
					var date1 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $(".tele-daterange-from").val());
					var date2 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $(".tele-daterange-to").val());
				}
				else {
					var date1 = new Date(telepath.range.start*1000);
					var date2 = new Date(telepath.range.end*1000);
				}


				return [true, date1 && ((date.getTime() == date1.getTime()) || (date2 && date >= date1 && date <= date2)) ? "dp-highlight" : ""];
			},
			onSelect: function(dateText, inst) {
				var date1 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $(".tele-daterange-from").val());
				var date2 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $(".tele-daterange-to").val());
				var selectedDate = $.datepicker.parseDate($.datepicker._defaults.dateFormat, dateText);
				if (!date1 || date2) {
					$(".tele-daterange-from").val(dateText);
					$(".tele-daterange-from-hour").val("00:00");
					$(".tele-daterange-to").val("");
					$(".tele-daterange-to-hour").val("23:59");
					$(this).datepicker();
				} else if( selectedDate < date1 ) {
					$(".tele-daterange-to").val( $(".tele-daterange-from").val() );
					$(".tele-daterange-to-hour").val( $(".tele-daterange-from-hours").val() );
					$(".tele-daterange-from").val( dateText);
					$(".tele-daterange-from-hour").val("00:00");
					$(this).datepicker();
				} else {
					$(".tele-daterange-to").val(dateText);
					$(".tele-daterange-to-hour").val("23:59");
					$(this).datepicker();
				}
			}
		});

		$(".tele-daterange-period a").click(function () {
			// console.log('HERE!');
			$(".tele-daterange-period a.active").removeClass('active');
			that.options.state = $(this).attr('class').split('-')[3]; // .split(' ')[0]
			$(this).addClass('active');
			that.setPeriod();
		});

		function get_hour_value(element) {

			var str = element.val();

			if(str == '') {
				element.val('');
				return 0;
			} else {
				str = str.split(':');
				if(str.length == 2) {
					return (parseInt(str[0]) * 3600 * 1000) + (parseInt(str[1]) * 60 * 1000);
				} else {
					element.val('');
					return 0;
				}
			}

		}

		$(".tele-daterange-buttons .tele-button-apply").click(function () {
			$(".tele-daterange-popup").fadeOut();
			if(typeof(that.options.change) == 'function') {

				if ($(".tele-daterange-period a.active").length )
					telepath.range.state = $(".tele-daterange-period a.active").attr('class').split(/-| /)[3];

				if (telepath.range.state  == 'range') {
					var from_date = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $(".tele-daterange-from").val());
					var to_date = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $(".tele-daterange-to").val());

					var from_date_hour = get_hour_value($(".tele-daterange-from-hour"));
					var to_date_hour = get_hour_value($(".tele-daterange-to-hour"));

					telepath.range.start = parseInt((from_date.getTime() + from_date_hour) / 1000);
					telepath.range.end = parseInt((to_date.getTime() + to_date_hour) / 1000);

					telepath.ds.get('/telepath/set_time_range', {
						state: telepath.range.state,
						start: telepath.range.start,
						end: telepath.range.end
					}, function (data) {
						that.options.change(telepath.range.start, telepath.range.end);
						that.options.state = telepath.range.state;
						that.options.start = telepath.range.start;
						that.options.end = telepath.range.end;
						if(that.button) {
							that.button.remove();
						}
						that.createButton();
					});

				}
				else{
					telepath.ds.get('/telepath/set_time_range', {
						state: telepath.range.state
					}, function (data) {
						that.options.state = telepath.range.state;
						var from_date = new Date();
						switch(that.options.state) {
							case 'data':
								telepath.range.start = telepath.fullRangeStart;
								break;
							case 'year':
								from_date.setFullYear(from_date.getFullYear() - 1);
								break;
							case 'month':
								from_date.setMonth(from_date.getMonth() - 1);
								break;
							case 'week':
								from_date.setDate(from_date.getDate() - 7);
								break;
							case 'day':
								from_date.setDate(from_date.getDate() - 1);
								break;
							case 'hour':
								from_date.setHours(from_date.getHours() - 1);
								break;
						}

							if(that.options.state!='data'){
								telepath.range.start = parseInt(from_date.getTime() / 1000);
							}
							telepath.range.end = parseInt(new Date().getTime() / 1000);


						that.options.start = telepath.range.start;
						that.options.end   = telepath.range.end;
						that.options.change(telepath.range.start, telepath.range.end);
						if(that.button) {
							that.button.remove();
						}
						that.createButton();
					});
				}

			}
		});
		$(".tele-daterange-buttons .tele-button-cancel").click(function () {
			$(".tele-daterange-popup").fadeOut();
		});

		that._update();

	},
	_update: function() {
		this.updateUI();
	},
	setPeriod: function() {

		var that = this;
		var from_date = new Date();
		//$('.tele-darerange-container').addClass('disabled');
		if (that.options.state =='range'){
				$('.tele-darerange-container').removeClass('disabled');
				/*telepath.ds.get('/telepath/set_full_time_range', { }, function(data) {

					// Globally

					telepath.range.start = data.items.start;
					telepath.range.end   = data.items.end;

					// Locally

					$(".tele-daterange-to").val(date_format('d/m/Y',data.items.end));
					$(".tele-daterange-to-hour").val(date_format('H:i',data.items.end));
					$(".tele-daterange-from").val(date_format('d/m/Y', data.items.start));
					$(".tele-daterange-from-hour").val(date_format('H:i', data.items.start));


				});*/

			//when select range state show data from the range of all data
			
			$(".tele-daterange-to").val(date_format('d/m/Y',Date.now()/1000));
			$(".tele-daterange-to-hour").val(date_format('H:i',Date.now()/1000));
			$(".tele-daterange-from").val(date_format('d/m/Y', telepath.fullRangeStart));
			$(".tele-daterange-from-hour").val(date_format('H:i', telepath.fullRangeStart));

		}
		else {
			$('.tele-darerange-container').addClass('disabled');
			$(".tele-daterange-to").val(date_format('d/m/Y',telepath.range.end));
			$(".tele-daterange-to-hour").val(date_format('H:i',telepath.range.end));
			$(".tele-daterange-from").val(date_format('d/m/Y', telepath.range.start));
			$(".tele-daterange-from-hour").val(date_format('H:i', telepath.range.start));
		}


	},
	updateUI: function() {

		var that = this;

		$(".tele-daterange-period a.active").removeClass('active')


		$(".tele-daterange-period a").each(function(){
			if($(this).attr('class').split('-')[3]== telepath.range.state )
				$(this).addClass("active");
		});

		$('.tele-darerange-container').addClass('disabled');


		if (telepath.range.state=='range'){
			$('.tele-darerange-container').removeClass('disabled');
		}

		// Load default values to display in textboxes
		$(".tele-daterange-from").val(date_format('d/m/Y', this.options.start));
		$(".tele-daterange-from-hour").val(date_format('H:i', this.options.start));
		$(".tele-daterange-to").val(date_format('d/m/Y', this.options.end));
		$(".tele-daterange-to-hour").val(date_format('H:i', this.options.end));



	},
	createButton: function () {

		var that = this;

		if (telepath.range.state == 'range') {
			var text =date_format('d/m/Y', this.options.start) + ' - ' + date_format('d/m/Y', this.options.end);
		}
		else if (telepath.range.state=='data')
			var text='All Data' ;
		else
			var text='Last '+ telepath.range.state[0].toUpperCase() + telepath.range.state.slice(1);

		this.button = $('<a>').attr('href', '#').btn({
			icon: 'daterange',
			text: text,
			callback: function () {
				that._displayPopup();
			}
		});

		this.element.append(this.button);
	}
});