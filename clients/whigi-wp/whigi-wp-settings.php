<div class='wrap whigi-settings'>
	<div id="whigi-settings-meta">Toggle tips: <ul><li><a id="whigi-settings-tips-on" href="#">On</a></li><li><a id="whigi-settings-tips-off" href="#">Off</a></li></ul><div class="nav-splitter"></div>Toggle sections: <ul><li><a id="whigi-settings-sections-on" href="#">On</a></li><li><a id="whigi-settings-sections-off" href="#">Off</a></li></ul></div>
	<h2>Whigi-WP Settings</h2>
	<!-- START Settings Header -->
	<div id="whigi-settings-header"></div>
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
			
			<!-- START Login with Whigi section -->
			<div id="whigi-settings-section-login-with-whigi" class="whigi-settings-section">
			<h3>Login with Whigi</h3>
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
					<input type='text' name='whigi_whigi_secret' value='<?php echo get_option('whigi_whigi_secret'); ?>' />
				</td>
				</tr>
			</table> <!-- .form-table -->
			<p>
				<strong>Instructions:</strong>
				<ol>
					<li>Register any account at <a href='https://whigi.envict.com' target="_blank">whigi.envict.com</a>.</li>
					<li>Paste your account ID/password into the fields above, then click the Save all settings button.</li>
				</ol>
			</p>
			<?php submit_button('Save all settings'); ?>
			</div> <!-- .form-padding -->
			</div> <!-- .whigi-settings-section -->
			<!-- END Login with LinkedIn section -->
			
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