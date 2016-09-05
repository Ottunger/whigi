//Hook after page fully loaded
jQuery(document).ready(function() {
	whigi.init();
});

;(function(whigi, undefined) {
	
	var wp_media_dialog_field;
	var timeout_interval;
	var timeout_idle_time = 0;
	var timeout_warning_reached = false;
	
	whigi.init = function() {
		
		//Date accuracy
		d = new Date; 
		gmtoffset = d.getTimezoneOffset() / 60;
		document.cookie = 'gmtoffset=' + gmtoffset;
		
		jQuery(".whigi-settings h3").click(function(e) {
			jQuery(this).parent().find(".form-padding").slideToggle();
		});
		jQuery(".tip-button").click(function(e) {
			e.preventDefault();
			jQuery(this).parents(".has-tip").find(".tip-message").fadeToggle();
		});
		jQuery(".whigi-settings input, .whigi-settings select").focus(function(e) {
			e.preventDefault();
			var tip_warning = jQuery(this).parents(".has-tip").find(".tip-warning, .tip-info");
			if(tip_warning.length > 0) {
				tip_warning.fadeIn();
				jQuery(this).parents(".has-tip").find(".tip-message").fadeIn();
			}
		});
		
		//Togglers
		jQuery("#whigi-settings-sections-on").click(function(e) {
			e.preventDefault();
			jQuery(".whigi-settings h3").parent().find(".form-padding").slideDown();
		});
		jQuery("#whigi-settings-sections-off").click(function(e) {
			e.preventDefault();
			jQuery(".whigi-settings h3").parent().find(".form-padding").slideUp();
		});
		jQuery("#whigi-settings-tips-on").click(function(e) {
			e.preventDefault();
			jQuery(".tip-message").fadeIn();
		});
		jQuery("#whigi-settings-tips-off").click(function(e) {
			e.preventDefault();
			jQuery(".tip-message").fadeOut();
		});

		//Button design
		jQuery("#whigi-login-form-new").click(function(e) {
			jQuery("#whigi-login-form-design").parents("tr").hide();
			jQuery("#whigi-login-form-design-form").addClass('new-design');
			jQuery("#whigi-login-form-design-form input").not(":button").val('');
			jQuery("#whigi-login-form-design-form h4").text('New Design');
			jQuery("#whigi-login-form-design-form").show();
		});
		
		jQuery("#whigi-login-form-edit").click(function(e) {
			var design_name = jQuery("#whigi-login-form-design :selected").text();
			var designs = jQuery("[name=whigi_login_form_designs]").val();
			var designs = JSON.parse(designs);
			var design = designs[design_name];
			if(design) {
				jQuery("[name=whigi_login_form_design_name]").val(design_name);
				jQuery("[name=whigi_login_form_icon_set]").val(design.icon_set);
				jQuery("[name=whigi_login_form_show_login]").val(design.show_login);
				jQuery("[name=whigi_login_form_show_logout]").val(design.show_logout);
				jQuery("[name=whigi_login_form_layout]").val(design.layout);
				jQuery("[name=whigi_login_form_button_prefix]").val(design.button_prefix);
				jQuery("[name=whigi_login_form_logged_out_title]").val(design.logged_out_title);
				jQuery("[name=whigi_login_form_logged_in_title]").val(design.logged_in_title);
				jQuery("[name=whigi_login_form_logging_in_title]").val(design.logging_in_title);
				jQuery("[name=whigi_login_form_logging_out_title]").val(design.logging_out_title);
				jQuery("#whigi-login-form-design").parents("tr").hide();
				jQuery("#whigi-login-form-design-form").removeClass('new-design');
				jQuery("#whigi-login-form-design-form h4").text('Edit Design');
				jQuery("#whigi-login-form-design-form").show();
			}
		});
		
		jQuery("#whigi-login-form-delete").click(function(e) {
			var designs = jQuery("[name=whigi_login_form_designs]").val();
			var designs = JSON.parse(designs);
			var old_design_name = jQuery("#whigi-login-form-design :selected").text();
			jQuery("#whigi-login-form-design option:contains('" + old_design_name + "')").remove();
			delete designs[old_design_name];
			jQuery("[name=whigi_login_form_designs]").val(JSON.stringify(designs));
		});
		
		jQuery("#whigi-login-form-ok").click(function(e) {
			var new_design_name = jQuery("[name=whigi_login_form_design_name]").val();
			jQuery("#whigi-login-form-design-form .validation-warning").remove();
			if(!jQuery("#whigi-login-form-design-name").val()) {
				var validation_warning = "<p id='validation-warning' class='validation-warning'>Design name cannot be empty.</span>";
				jQuery("#whigi-login-form-design-name").parent().append(validation_warning);
				return;
			}
			if(jQuery("#whigi-login-form-design-form").hasClass('new-design')) {
				if(jQuery("#whigi-login-form-design option").text().indexOf(new_design_name) != -1) {
					var validation_warning = "<p id='validation-warning' class='validation-warning'>Design name already exists! Please choose a different name.</span>";
					jQuery("#whigi-login-form-design-name").parent().append(validation_warning);
					return;
				} else {
					var designs = jQuery("[name=whigi_login_form_designs]").val();
					var designs = JSON.parse(designs);
					designs[new_design_name] = {};
					designs[new_design_name].icon_set = jQuery("[name=whigi_login_form_icon_set]").val();
					designs[new_design_name].show_login = jQuery("[name=whigi_login_form_show_login]").val();
					designs[new_design_name].show_logout = jQuery("[name=whigi_login_form_show_logout]").val();
					designs[new_design_name].layout = jQuery("[name=whigi_login_form_layout]").val();
					designs[new_design_name].button_prefix = jQuery("[name=whigi_login_form_button_prefix]").val();
					designs[new_design_name].logged_out_title = jQuery("[name=whigi_login_form_logged_out_title]").val();
					designs[new_design_name].logged_in_title = jQuery("[name=whigi_login_form_logged_in_title]").val();
					designs[new_design_name].logging_in_title = jQuery("[name=whigi_login_form_logging_in_title]").val();
					designs[new_design_name].logging_out_title = jQuery("[name=whigi_login_form_logging_out_title]").val();
					jQuery("#whigi-login-form-design").append(jQuery("<option></option>").text(new_design_name).attr("selected", "selected"));
					jQuery("[name=whigi_login_form_designs]").val(JSON.stringify(designs));
					jQuery("#whigi-login-form-design").parents("tr").show();
					jQuery("#whigi-login-form-design-form").hide();
				}
			} else {
				//Modified design, should not happen...
				var designs = jQuery("[name=whigi_login_form_designs]").val();
				var designs = JSON.parse(designs);
				var old_design_name = jQuery("#whigi-login-form-design :selected").text();
				jQuery("#whigi-login-form-design option:contains('" + old_design_name + "')").remove();
				delete designs[old_design_name];
				designs[new_design_name] = {};
				designs[new_design_name].icon_set = jQuery("[name=whigi_login_form_icon_set]").val();
				designs[new_design_name].show_login = jQuery("[name=whigi_login_form_show_login]").val();
				designs[new_design_name].show_logout = jQuery("[name=whigi_login_form_show_logout]").val();
				designs[new_design_name].layout = jQuery("[name=whigi_login_form_layout]").val();
				designs[new_design_name].button_prefix = jQuery("[name=whigi_login_form_button_prefix]").val();
				designs[new_design_name].logged_out_title = jQuery("[name=whigi_login_form_logged_out_title]").val();
				designs[new_design_name].logged_in_title = jQuery("[name=whigi_login_form_logged_in_title]").val();
				designs[new_design_name].logging_in_title = jQuery("[name=whigi_login_form_logging_in_title]").val();
				designs[new_design_name].logging_out_title = jQuery("[name=whigi_login_form_logging_out_title]").val();
				jQuery("#whigi-login-form-design").append(jQuery("<option></option>").text(new_design_name).attr("selected", "selected"));
				jQuery("[name=whigi_login_form_designs]").val(JSON.stringify(designs));
				jQuery("#whigi-login-form-design").parents("tr").show();
				jQuery("#whigi-login-form-design-form").hide();
			}
		});
		
		jQuery("#whigi-login-form-cancel").click(function(e) {
			jQuery("#whigi-login-form-design").parents("tr").show();
			jQuery("#whigi-login-form-design-form").hide();
		});
		
		//Login redirect
		jQuery("[name=whigi_login_redirect]").change(function() {
			jQuery("[name=whigi_login_redirect_url]").hide();
			jQuery("[name=whigi_login_redirect_page]").hide();
			var val = jQuery(this).val();
			if(val == "specific_page") {
				jQuery("[name=whigi_login_redirect_page]").show();
			} else if(val == "custom_url") {
				jQuery("[name=whigi_login_redirect_url]").show();
			}
		});
		
		//Logout redirect
		jQuery("[name=whigi_login_redirect]").change();
		jQuery("[name=whigi_logout_redirect]").change(function() {
			jQuery("[name=whigi_logout_redirect_url]").hide();
			jQuery("[name=whigi_logout_redirect_page]").hide();
			var val = jQuery(this).val();
			if(val == "specific_page") {
				jQuery("[name=whigi_logout_redirect_page]").show();
			} else if(val == "custom_url") {
				jQuery("[name=whigi_logout_redirect_url]").show();
			}
		});
		jQuery("[name=whigi_logout_redirect]").change();
		
		//WP media for selecting image
		jQuery('#whigi_logo_image_button').click(function(e) {
			e.preventDefault();
			wp_media_dialog_field = jQuery('#whigi_logo_image');
			whigi.selectMedia();
		});
		
		//Idem, BG image
		jQuery('#whigi_bg_image_button').click(function(e) {
			e.preventDefault();
			wp_media_dialog_field = jQuery('#whigi_bg_image');
			whigi.selectMedia();
		});
		
		//Login form
		jQuery(".whigi-login-button").click(function(event) {
			event.preventDefault();
			window.location = jQuery(this).attr("href");
			//Remove WP classic one
			jQuery("#login #loginform").fadeOut();
			jQuery("#login #nav").fadeOut();
			jQuery("#login #backtoblog").fadeOut();
			jQuery(".message").fadeOut();
			jQuery(".whigi-login-form .whigi-login-button").not(this).addClass("loading-other");
			jQuery(".whigi-login-form .whigi-logout-button").addClass("loading-other");
			jQuery(this).addClass("loading");
			var logging_in_title = jQuery(this).parents(".whigi-login-form").data("logging-in-title");
			jQuery(".whigi-login-form #whigi-title").text(logging_in_title);
		});
		
		//Logout form
		jQuery(".whigi-logout-button").click(function(event) {
			jQuery("#login #loginform").fadeOut();
			jQuery("#login #nav").fadeOut();
			jQuery("#login #backtoblog").fadeOut();
			jQuery(this).addClass("loading");
			jQuery(".whigi-login-form .whigi-logout-button").not(this).addClass("loading-other");
			jQuery(".whigi-login-form .whigi-login-button").addClass("loading-other");
			var logging_out_title = jQuery(this).parents(".whigi-login-form").data("logging-out-title");
			jQuery(".whigi-login-form #whigi-title").text(logging_out_title);
		});
		
		var msg = jQuery("#whigi-result").html();
		if(msg) {
			if(whigi_cvars.show_login_messages) {
				whigi.notify(msg);
			} else {
				console.log(msg);
			}
		}
		
		if(whigi_cvars.logged_in === '1' && whigi_cvars.logout_inactive_users !== '0') {
			jQuery(document).mousemove(function(e) {
				timeout_idle_time = 0;
			});
			jQuery(document).keypress(function(e) {
				timeout_idle_time = 0;
			});
			timeout_interval = setInterval(whigi.timeoutIncrement, 60000);
		}
		
		if(whigi_cvars.hide_login_form == 1) {
			jQuery("#login #loginform").remove();
			jQuery("#login #nav").remove();
			jQuery("#login #backtoblog").remove();
		}
		
		if(document.URL.indexOf("wp-login") >= 0) {
			if(whigi_cvars.logo_image) {
				jQuery(".login h1 a").css("background-image", "url(" + whigi_cvars.logo_image + ")");
			}
			if(whigi_cvars.bg_image) {
				jQuery("body").css("background-image", "url(" + whigi_cvars.bg_image + ")");
				jQuery("body").css("background-size", "cover");
			}
		}
	}
	
	//Show a tip
	whigi.showTip = function(id) {
		jQuery(id).parents("tr").find(".tip-message").fadeIn();
	}
	
	//Select an image
	whigi.selectMedia = function() {
		var custom_uploader;
		if(custom_uploader) {
			custom_uploader.open();
			return;
		}
		custom_uploader = wp.media.frames.file_frame = wp.media({
			title: 'Choose Image',
			button: {
				text: 'Choose Image'
			},
			multiple: false
		});
		custom_uploader.on('select', function() {
			attachment = custom_uploader.state().get('selection').first().toJSON();
			wp_media_dialog_field.val(attachment.url);
		});
		custom_uploader.open();
	}

	//Notif
	whigi.notify = function(msg) {
		jQuery(".whigi-login-message").remove();
		var h = "";
		h += "<div class='whigi-login-message'><span>" + msg + "</span></div>";
		jQuery("body").prepend(h);
		jQuery(".whigi-login-message").fadeOut(5000);
	}
	
	whigi.dialog = function(msg) {}
	
	//Logout
	whigi.processLogout = function(callback) {
		var data = {
			'action': 'whigi_logout',
		};
		jQuery.ajax({
			url: whigi_cvars.ajaxurl,
			data: data,
			success: function(json) {
				window.location = whigi_cvars.url + "/";
			}
		});
	}
	
})(window.whigi = window.whigi || {});