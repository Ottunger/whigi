<div class='wrap whigi-settings'>
	<div id="whigi-settings-meta">Toggle tips: <ul><li><a id="whigi-settings-tips-on" href="#">On</a></li><li><a id="whigi-settings-tips-off" href="#">Off</a></li></ul><div class="nav-splitter"></div>Toggle sections: <ul><li><a id="whigi-settings-sections-on" href="#">On</a></li><li><a id="whigi-settings-sections-off" href="#">Off</a></li></ul></div>
	<h2>Whigi-WP Settings</h2>
	<!-- START Settings Header -->
	<div id="whigi-settings-header">
	<p>
		Welcome to Whigi-WP. This plugin aims at integrating Whigi into WP, and so modifies a bit the default behavior or Wordpress:
		Any user can now register always using a Whigi account, because a Whigi account is nothing but an account here as well.$_COOKIE
		Therefore, we do not need anymore the registration form (login is enough!), the lost password, not the add user manually.
	</p>
	<p>
		Aside this, Whigi-WP also allows other plugins to access the metadata associated to a user. To achieve this, they must register the data
		that your site will request to your users. 
	</p>
	<p>
		Your free installation base is configured to work with Whigi. This means that your users will be able to self modify their data, and that you
		will see the changes directly. If you ever need some help with our products, do not hesitate to reach us at the site where you registered this free account, ot at Whigi itself.
	</p>
	<p>
		For now, Whigi-WP and s2Member (Whigi) are known NOT to work with a vast majority of plugins that rely on meta key names not supported. However,
		the change required for those plugins is really small, and we expect some to start being compatible rather soon (we will help in this way as well).
		However, try not to install another plugin that messes up with the login mechanism at the same time, as this is really likely to cause not desired responses.
	</p>
	</div>
	<!-- END Settings Header -->
	<!-- START Settings Body -->
	<div id="whigi-settings-body">
	<!-- START Settings Column 1 -->
	<div id="whigi-settings-col1" class="whigi-settings-column">
		<form method='post' action='options.php'>
			<?php settings_fields('whigi_settings'); ?>
			<?php do_settings_sections('whigi_settings'); ?>
			<!-- START General Settings section -->
			<div id="whigi-settings-section-general-settings" class="whigi-settings-section">
			<h3>General Settings</h3>
			<div class='form-padding'>
			<table class='form-table'>
				<tr valign='top' class='has-tip' class="has-tip">
				<th scope='row'>Show login messages: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input type='checkbox' name='whigi_show_login_messages' value='1' <?php checked(get_option('whigi_show_login_messages') == 1); ?> />
					<p class="tip-message">Shows a short-lived notification message to the user which indicates whether or not the login was successful, and if there was an error.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Login redirects to: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input type="text" name="whigi_login_redirect_url" value="<?php echo get_option('whigi_login_redirect_url'); ?>" />
					<p class="tip-message">Specifies where to redirect a user after they log in.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Logout redirects to: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input type="text" name="whigi_logout_redirect_url" value="<?php echo get_option('whigi_logout_redirect_url'); ?>" />
					<p class="tip-message">Specifies where to redirect a user after they log out.</p>
				</td>
				</tr>

			</table> <!-- .form-table -->
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END General Settings section -->

			<!-- START Login Page & Form Customization section -->
			<div id="whigi-settings-section-login-forms" class="whigi-settings-section">
			<h3>Login Forms</h3>
			<div class='form-padding'>
			<table class='form-table'>
				
				<tr valign='top'>
				<th colspan="2">
					<h4>Default Login Form / Page / Popup</h4>
				</th>
				</td>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Logo image: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<p>
					<input id='whigi_logo_image' type='text' size='' name='whigi_logo_image' value="<?php echo get_option('whigi_logo_image'); ?>" />
					<input id='whigi_logo_image_button' type='button' class='button' value='Select' />
					</p>
					<p class="tip-message">Changes the default WordPress logo on the login form to an image of your choice. You may select an image from the Media Library, or specify a custom URL.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Background image: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<p>
					<input id='whigi_bg_image' type='text' size='' name='whigi_bg_image' value="<?php echo get_option('whigi_bg_image'); ?>" />
					<input id='whigi_bg_image_button' type='button' class='button' value='Select' />
					</p>
					<p class="tip-message">Changes the background on the login form to an image of your choice. You may select an image from the Media Library, or specify a custom URL.</p>
				</td>
				</tr>
				
				<tr valign='top'>
				<th colspan="2">
					<h4>Custom Login Forms</h4>
				</th>
				</td>
			
				<tr valign='top' class="has-tip">
				<th scope='row'>Custom form to show on the login screen: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<?php echo WHIGI::whigi_login_form_designs_selector('whigi-login-form-show-login-screen'); ?>
					<p class="tip-message">Create or manage these login form designs in the CUSTOM LOGIN FORM DESIGNS section.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Custom form to show on the user's profile page: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<?php echo WHIGI::whigi_login_form_designs_selector('whigi-login-form-show-profile-page'); ?>
					<p class="tip-message">Create or manage these login form designs in the CUSTOM LOGIN FORM DESIGNS section.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Custom form to show in the comments section: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<?php echo WHIGI::whigi_login_form_designs_selector('whigi-login-form-show-comments-section'); ?>
					<p class="tip-message">Create or manage these login form designs in the CUSTOM LOGIN FORM DESIGNS section.</p>
				</td>
				</tr>
			</table> <!-- .form-table -->
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END Login Page & Form Customization section -->

			<!-- START Custom Login Form Designs section -->
			<div id="whigi-settings-section-custom-login-form-designs" class="whigi-settings-section">
			<h3>Custom Login Form Designs</h3>
			<div class='form-padding'>
			<p>You may create multiple login form <strong><em>designs</em></strong> and use them throughout your site. A design is essentially a re-usable <em>shortcode preset</em>. Instead of writing out the login form shortcode ad-hoc each time you want to use it, you can build a design here, save it, and then specify that design in the shortcode's <em>design</em> attribute. For example: <pre><code>[whigi_login_form design='CustomDesign1']</code></pre></p>
			<table class='form-table'>
				<tr valign='top' class="has-tip">
				<th scope='row'>Design: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<?php echo WHIGI::whigi_login_form_designs_selector('whigi-login-form-design', true); ?>
					<p>
					<input type="button" id="whigi-login-form-new" class="button" value="New">
					<input type="button" id="whigi-login-form-edit" class="button" value="Edit">
					<input type="button" id="whigi-login-form-delete" class="button" value="Delete">
					</p>
					<p class="tip-message">Here you may create a new design, select an existing design to edit, or delete an existing design.</p>
					<p class="tip-message tip-info"><strong>Tip: </strong>Make sure to click the <em>Save all settings</em> button after making changes here.</p>
				</td>
				</tr>
			</table> <!-- .form-table -->
			
			<table class="form-table" id="whigi-login-form-design-form">
				<tr valign='top'>
				<th colspan="2">
					<h4>Edit Design</h4>
				</th>
				</td>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Design name: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input id='whigi-login-form-design-name' type='text' size='36' name='whigi_login_form_design_name' value="" />
					<p class="tip-message">Sets the name to use for this design.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Icon set: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<select name='whigi_login_form_icon_set'>
						<option value='none'>None</option>
						<option value='hex'>Hex</option>
					</select>
					<p class="tip-message">Specifies which icon set to use for displaying provider icons on the login buttons.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Show login buttons: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<select name='whigi_login_form_show_login'>
						<option value='always'>Always</option>
						<option value='conditional'>Conditional</option>
						<option value='never'>Never</option>
					</select>
					<p class="tip-message">Determines when the login buttons should be shown.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Show logout button: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<select name='whigi_login_form_show_logout'>
						<option value='always'>Always</option>
						<option value='conditional'>Conditional</option>
						<option value='never'>Never</option>
					</select>
					<p class="tip-message">Determines when the logout button should be shown.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Layout: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<select name='whigi_login_form_layout'>
						<option value='links-row'>Links Row</option>
						<option value='links-column'>Links Column</option>
						<option value='buttons-row'>Buttons Row</option>
						<option value='buttons-column'>Buttons Column</option>
					</select>
					<p class="tip-message">Sets vertical or horizontal layout for the buttons.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Login button prefix: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input id='whigi_login_form_button_prefix' type='text' size='36' name='whigi_login_form_button_prefix' value="" />
					<p class="tip-message">Sets the text prefix to be displayed on the social login buttons.</p>
				</td>
				</tr>
			
				<tr valign='top' class="has-tip">
				<th scope='row'>Logged out title: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input id='whigi_login_form_logged_out_title' type='text' size='36' name='whigi_login_form_logged_out_title' value="" />
					<p class="tip-message">Sets the text to be displayed above the login form for logged out users.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Logged in title: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input id='whigi_login_form_logged_in_title' type='text' size='36' name='whigi_login_form_logged_in_title' value="" />
					<p class="tip-message">Sets the text to be displayed above the login form for logged in users.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Logging in title: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input id='whigi_login_form_logging_in_title' type='text' size='36' name='whigi_login_form_logging_in_title' value="" />
					<p class="tip-message">Sets the text to be displayed above the login form for users who are logging in.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Logging out title: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input id='whigi_login_form_logging_out_title' type='text' size='36' name='whigi_login_form_logging_out_title' value="" />
					<p class="tip-message">Sets the text to be displayed above the login form for users who are logging out.</p>
				</td>
				</tr>
				
				<tr valign='top' id='whigi-login-form-actions'>
				<th scope='row'>
					<input type="button" id="whigi-login-form-ok" name="whigi_login_form_ok" class="button" value="OK">
					<input type="button" id="whigi-login-form-cancel" name="whigi_login_form_cancel" class="button" value="Cancel">
				</th>
				<td>
					
				</td>
				</tr>
			</table> <!-- .form-table -->
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END Login Buttons section -->
			
			<!-- START Login with Whigi section -->
			<div id="whigi-settings-section-login-with-whigi" class="whigi-settings-section">
			<h3>Whigi provider parameters</h3>
			<h4>You may need to deactivate/reactivate the plugin when you change these settings !</h4>
			<div class='form-padding'>
			<table class='form-table'>
				<tr valign='top'>
				<th scope='row'>ID:</th>
				<td>
					<input type='text' name='whigi_whigi_id' value='<?php echo get_option('whigi_whigi_id'); ?>' />
				</td>
				</tr>
				 
				<tr valign='top'>
				<th scope='row'>Secret password:</th>
				<td>
					<input type='password' name='whigi_whigi_secret' value='<?php echo get_option('whigi_whigi_secret'); ?>' />
				</td>
				</tr>

				<tr valign='top'>
				<th scope='row'>Whigi provider (name:port):</th>
				<td>
					<input type='text' name='whigi_whigi_host' value='<?php echo get_option('whigi_whigi_host'); ?>' />
				</td>
				</tr>

				<tr valign='top'>
				<th scope='row'>Initially required fields (see generics, separate values with //, plugins should set this on their own):</th>
				<td>
					<input type='text' name='whigi_whigi_data' value='<?php echo get_option('whigi_whigi_data'); ?>' />
				</td>
				</tr>

				<tr valign='top'>
				<th scope='row'>Directory prefix for newly added data (should not end with /):</th>
				<td>
					<input type='text' name='whigi_whigi_prefix' value='<?php echo get_option('whigi_whigi_prefix'); ?>' />
				</td>
				</tr>

				<tr valign='top'>
				<th scope='row'>Access time required for granted data in months:</th>
				<td>
					<input type='text' name='whigi_whigi_time' value='<?php echo get_option('whigi_whigi_time'); ?>' />
				</td>
				</tr>

				<tr valign='top'>
				<th scope='row'>Trigger URL for shared data change (for compliance with other plugins):</th>
				<td>
					<input type='text' name='whigi_whigi_trigger' value='<?php echo get_option('whigi_whigi_trigger'); ?>' />
				</td>
				</tr>

				<tr valign='top'>
				<th scope='row'>Prefix for self inserted data into DB (other plugins should use get_option('whigi_db_prefix')):</th>
				<td>
					<input type='text' name='whigi_db_prefix' value='<?php echo get_option('whigi_db_prefix'); ?>' />
				</td>
				</tr>
			</table> <!-- .form-table -->
			<p>
				<strong>Instructions:</strong>
				<ol>
					<li>Register any account at <a href='https://whigi2-demo.envict.com' target="_blank">whigi2-demo.envict.com</a>, or another Whigi provider.</li>
					<li>Paste your account ID/password into the fields above, then click the Save all settings button.</li>
				</ol>
			</p>
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END Login with Whigi section -->

			<!-- START Generics section -->
			<div id="whigi-settings-section-login-with-whigi" class="whigi-settings-section">
			<h3>Generics requestable definitions</h3>
			<div class='form-padding'>
			<table class='form-table'>
				<?php
					$i18n = get_option('whigi_i18n_en');
					foreach(get_option('whigi_generics') as $key => $val) {
						echo "<tr valign='top'>";
						echo "<th scope='row'>" . $i18n[$val["descr_key"]] . "</th>";
						$held = "No keys";
						if(!empty($val['json_keys'])) {
							$held = "Keys: "
							foreach($val['json_keys'] as $key => $val) {
								$held .= $val . "(" . $i18n[$val] . "), ";
							}
						}
						echo "<td>" . $key . "</td><td>" . (($val['is_dated'])? 'Dated field' : 'Not dated') . "</td><td>" . $held . "</td></tr>";
						echo "";
					}
				?>
			</table> <!-- .form-table -->
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END Generics section -->
			
			<!-- START Back Channel Configuration section -->
			<div id="whigi-settings-section-back-channel=configuration" class="whigi-settings-section">
			<h3>Back Channel Configuration</h3>
			<div class='form-padding'>
			<p>These settings are for troubleshooting and/or fine tuning the back channel communication this plugin utilizes between your server and the third-party providers.</p>
			<table class='form-table'>
				<tr valign='top' class="has-tip">
				<th scope='row'>HTTP utility: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<select name='whigi_http_util'>
						<option value='curl' <?php selected(get_option('whigi_http_util'), 'curl'); ?>>cURL</option>
						<option value='stream-context' <?php selected(get_option('whigi_http_util'), 'stream-context'); ?>>Stream Context</option>
					</select>
					<p class="tip-message">The method used by the web server for performing HTTP requests to the third-party providers. Most servers support cURL, but some servers may require Stream Context instead.</p>
				</td>
				</tr>
				
				<tr valign='top' class="has-tip">
				<th scope='row'>Verify Peer/Host SSL Certificates: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input type='checkbox' name='whigi_http_util_verify_ssl' value='1' <?php checked(get_option('whigi_http_util_verify_ssl') == 1); ?> />
					<p class="tip-message">Determines whether or not to validate peer/host SSL certificates during back channel HTTP calls to the third-party login providers. If your server has an incorrect SSL configuration or doesn't support SSL, you may try disabling this setting as a workaround.</p>
					<p class="tip-message tip-warning"><strong>Warning:</strong> Disabling this is not recommended. For maximum security it would be a good idea to get your server's SSL configuration fixed and keep this setting enabled.</p>
				</td>
				</tr>
			</table> <!-- .form-table -->
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END Back Channel Configuration section -->
			
			<!-- START Maintenance & Troubleshooting section -->
			<div id="whigi-settings-section-maintenance-troubleshooting" class="whigi-settings-section">
			<h3>Maintenance &amp; Troubleshooting</h3>
			<div class='form-padding'>
			<table class='form-table'>
				<tr valign='top' class="has-tip">
				<th scope='row'>Restore default settings: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input type='checkbox' name='whigi_restore_default_settings' value='1' <?php checked(get_option('whigi_restore_default_settings') == 1); ?> />
					<p class="tip-message"><strong>Instructions:</strong> Check the box above, click the Save all settings button, and the settings will be restored to default.</p>
					<p class="tip-message tip-warning"><strong>Warning:</strong> This will restore the default settings, erasing any API id/secret that you may have entered above.</p>
				</td>
				</tr>		
				<tr valign='top' class="has-tip">
				<th scope='row'>Delete settings on uninstall: <a href="#" class="tip-button">[?]</a></th>
				<td>
					<input type='checkbox' name='whigi_delete_settings_on_uninstall' value='1' <?php checked(get_option('whigi_delete_settings_on_uninstall') == 1); ?> />
					<p class="tip-message"><strong>Instructions:</strong> Check the box above, click the Save all settings button, then uninstall this plugin as normal from the Plugins page.</p>
					<p class="tip-message tip-warning"><strong>Warning:</strong> This will delete all settings that may have been created in your database by this plugin, including all linked third-party login providers. This will not delete any WordPress user accounts, but users who may have registered with or relied upon their third-party login providers may have trouble logging into your site. Make absolutely sure you won't need the values on this page any time in the future, because they will be deleted permanently.</p>
				</td>
				</tr>
			</table> <!-- .form-table -->
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END  Maintenance & Troubleshooting section -->
		</form> <!-- form -->
	</div>
	<!-- END Settings Column 1 -->
	</div> <!-- #whigi-settings-body -->
	<!-- END Settings Body -->
</div> <!-- .wrap .whigi-settings -->