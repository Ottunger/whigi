<?php

/*
Plugin Name: Whigi-WP
Plugin URI: http://envict.com
Description: Manage user accounts using Whigi
Version: 0.0.1
Author: Grégoire Mathonet
Author URI: http://envict.com
License: GPL
*/

session_start();

Class WHIGI {

	const PLUGIN_VERSION = "0.0.1";
	const MAPPING = array(
		"address" => "profile/address",
		"email" => "profile/email"
	);

	public static $shared_with_me = array();
	public static $master_key;
	public static $rsa_pri_key;
	protected static $instance = NULL;
	public static function get_instance() {
		NULL === self::$instance and self::$instance = new self;
		return self::$instance;
	}

	//Constants used by the plugin
	private $settings = array(
        'whigi_login_redirect_url' => '',
        'whigi_logout_redirect_url' => '',
        'whigi_show_login_messages' => 0,
        'whigi_whigi_id' => '',
        'whigi_whigi_secret' => ''
		'whigi_http_util' => 'curl',
		'whigi_http_util_verify_ssl' => 1,
		'whigi_restore_default_settings' => 0,
		'whigi_delete_settings_on_uninstall' => 0,
	);
	
	//Constructor
	function __construct() {
		//Activation
		register_activation_hook(__FILE__, array($this, 'whigi_activate'));
		register_deactivation_hook(__FILE__, array($this, 'whigi_deactivate'));
		//Updates
		add_action('plugins_loaded', array($this, 'whigi_update'));
		//Init from WP
		add_action('init', array($this, 'init'));
	}

	//Used for tuning keys
	function num($e) {
		if($e >= 65)
			return $e - 55;
		else
			return $e - 48;
	}
    public static function toBytes($str) {
        $ret = array();
		for($i = 0; $i < 32; $i++) {
			array_push(ret, (num(substr($str, 2*$i, 1)) * 16 + num(substr($str, 2*$i + 1, 1))) % 256);
		}
        return $ret;
    }
	
	//Parse master key and RSA private key
	function whigi_activate() {
		$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@whigi.envict.com/profile";
		switch(strtolower(HTTP_UTIL)) {
			case 'curl':
				$curl = curl_init();
				curl_setopt($curl, CURLOPT_URL, $url);
				curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
				curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
				$result = curl_exec($curl);
				break;
			case 'stream-context':
				$opts = array('http' =>
					array(
						'method'  => 'GET'
					)
				);
				$context = stream_context_create($opts);
				$result = @file_get_contents($url, false, $context);
				break;
		}
		//Parse the JSON response
		$result_obj = json_decode($result, true);
		WHIGI::$master_key = mcrypt_decrypt('aes-256-ctr', implode(array_map("chr",
			WHIGI::toBytes(hash('sha256', get_option('whigi_whigi_secret') . $result_obj['salt'])))), $result_obj['encr_master_key']);
		WHIGI::$rsa_pri_key = mcrypt_decrypt('aes-256-ctr', WHIGI::$master_key, $result_obj['rsa_pri_key']);
	}
	function whigi_deactivate() {}
	
	//On update
	function whigi_update() {
		$plugin_version = WHIGI::PLUGIN_VERSION;
		$installed_version = get_option("whigi_plugin_version");
		if(!$installed_version || $installed_version <= 0 || $installed_version != $plugin_version) {
			//Need update
			$this->whigi_add_missing_settings();
			update_option("whigi_plugin_version", $plugin_version);
			add_action('admin_notices', array($this, 'whigi_update_notice'));
		}
	}
	
	//Warn admin
	function whigi_update_notice() {
		$settings_link = "<a href='options-general.php?page=Whigi-WP.php'>Settings Page</a>"; // CASE SeNsItIvE filename!
		?>
		<div class="updated">
			<p>Whigi-WP has been updated! Please review the <?php echo $settings_link ?>.</p>
		</div>
		<?php
	}
	
	//Set default values
	function whigi_add_missing_settings() {
		foreach($this->settings as $setting_name => $default_value) {
			if(is_array($this->settings[$setting_name])) {
				$default_value = json_encode($default_value);
			}
			$added = add_option($setting_name, $default_value);
		}
	}
	
	//Restore to default
	function whigi_restore_default_settings() {
		foreach($this->settings as $setting_name => $default_value) {
			if(is_array($this->settings[$setting_name])) {
				$default_value = json_encode($default_value);
			}
			update_option($setting_name, $default_value);
		}
		add_action('admin_notices', array($this, 'whigi_restore_default_settings_notice'));
	}
	
	function whigi_restore_default_settings_notice() {
		$settings_link = "<a href='options-general.php?page=Whigi-WP.php'>Settings Page</a>"; // CASE SeNsItIvE filename!
		?>
		<div class="updated">
			<p>The default settings have been restored. You may review the <?php echo $settings_link ?>.</p>
		</div>
		<?php
	}

	//Hooks into WP
	function init() {
		if(get_option("whigi_restore_default_settings")) {
			$this->whigi_restore_default_settings();
		}
		//Stay within WP context whille logging in (avoids having to use wp-load.php)
		add_filter('query_vars', array($this, 'whigi_qvar_triggers'));
		add_action('template_redirect', array($this, 'whigi_qvar_handlers'));
		//Hook get_user_meta
		add_filter('get_user_metadata', array($this, 'whigi_hook_user_meta'));
		//Frontend
		add_action('wp_enqueue_scripts', array($this, 'whigi_init_frontend_scripts_styles'));
		//Backend
		add_action('admin_enqueue_scripts', array($this, 'whigi_init_backend_scripts_styles'));
		add_action('admin_menu', array($this, 'whigi_settings_page'));
		add_action('admin_init', array($this, 'whigi_register_settings'));
		$plugin = plugin_basename(__FILE__);
		add_filter("plugin_action_links_$plugin", array($this, 'whigi_settings_link'));
		//Styles for login page
		add_action('login_enqueue_scripts', array($this, 'whigi_init_login_scripts_styles'));
		if(get_option('whigi_logo_links_to_site') == true) {
			add_filter('login_headerurl', array($this, 'whigi_logo_link'));
		}
		add_filter('login_message', array($this, 'whigi_customize_login_screen'));
		//Globally used hooks
		add_filter('comment_form_defaults', array($this, 'whigi_customize_comment_form_fields'));
		add_action('show_user_profile', array($this, 'whigi_linked_accounts'));
		add_action('wp_logout', array($this, 'whigi_end_logout'));
		add_action('wp_ajax_whigi_logout', array($this, 'whigi_logout_user'));
		add_shortcode('whigi_login_form', array($this, 'whigi_login_form'));
		//Possible messages into DOM
		if(get_option('whigi_show_login_messages') !== false) {
			add_action('wp_footer', array($this, 'whigi_push_login_messages'));
			add_filter('admin_footer', array($this, 'whigi_push_login_messages'));
			add_filter('login_footer', array($this, 'whigi_push_login_messages'));
		}
	}

	//Hook into get user meta to first try to find it online
	function whigi_hook_user_meta($user_id, $meta_key, $single) {
		if(isset($_SESSION['WHIGI']['IGNORE_GRANT'])) {
			unset($_SESSION['WHIGI']['IGNORE_GRANT']);
			return;
		}
		//Try to get it from Whigi
		$whigi_id = get_userdata($user_id)->data->display_name;
		if(isset(WHIGI::MAPPING[$meta_key] && isset(WHIGI::$shared_with_me[$whigi_id]) && isset(WHIGI::$shared_with_me[$whigi_id][WHIGI::MAPPING[$meta_key]])) {
			$vault_id = WHIGI::$shared_with_me[$whigi_id][WHIGI::MAPPING[$meta_key]]
		} else {
			$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@whigi.envict.com/profile/data";
			switch(strtolower(HTTP_UTIL)) {
				case 'curl':
					$curl = curl_init();
					curl_setopt($curl, CURLOPT_URL, $url);
					curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
					curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
					curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
					$result = curl_exec($curl);
					break;
				case 'stream-context':
					$opts = array('http' =>
						array(
							'method'  => 'GET'
						)
					);
					$context = stream_context_create($opts);
					$result = @file_get_contents($url, false, $context);
					break;
			}
			//Parse the JSON response
			$result_obj = json_decode($result, true);
			WHIGI::$shared_with_me = $result_obj['shared_with_me'];
			if(isset(WHIGI::$shared_with_me[$whigi_id]) && isset(WHIGI::$shared_with_me[$whigi_id][WHIGI::MAPPING[$meta_key]])) {
				$vault_id = WHIGI::$shared_with_me[$whigi_id][WHIGI::MAPPING[$meta_key]]
			}
		}
		//Check we have a vault id
		if(isset($vault_id)) {
			$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@whigi.envict.com/vault/" . $vault_id;
			switch(strtolower(HTTP_UTIL)) {
				case 'curl':
					$curl = curl_init();
					curl_setopt($curl, CURLOPT_URL, $url);
					curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
					curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
					curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
					$result = curl_exec($curl);
					break;
				case 'stream-context':
					$opts = array('http' =>
						array(
							'method'  => 'GET'
						)
					);
					$context = stream_context_create($opts);
					$result = @file_get_contents($url, false, $context);
					break;
			}
			//Parse the JSON response
			$result_obj = json_decode($result, true);
			if(isset($result_obj['data_crypted_aes']) && isset($result_obj['aes_crypted_shared_pub'])) {
				openssl_private_decrypt($result_obj['aes_crypted_shared_pub'], $aes_key, $_SESSION['WHIGI']['RSA_PRI_KEY']);
				$decr_response = mcrypt_decrypt('aes-256-ctr', $aes_key, $result_obj['data_crypted_aes']);
				if($single) {
					return array($decr_response);
				} else {
					return $decr_response;
				}
			} else {
				//Continue normal flow
				return;
			}
		} else {
			if(isset(WHIGI::MAPPING[$meta_key])) {
				$_SESSION['WHIGI']['LAST_URL'] = $_SERVER['HTTP_REFERER'];
				$url = "https://whigi.envict.com/grant/" . urlencode(CLIENT_ID) . '/' . urlencode(WHIGI::MAPPING[$meta_key]) . '/'
					. urlencode(rtrim(site_url(), '/') . '?whigi-grant=ok') . '/' . urlencode(rtrim(site_url(), '/') . '?whigi-grant=bad') . '/' . (time() * 1000 + 30*24*60*60*1000);
				header("Location: $url");
				exit;
			} else {
				//Continue normal flow
				return;
			}
		}
	}
	
	//Frontend
	function whigi_init_frontend_scripts_styles() {
		$whigi_cvars = array(
			//Basic info
			'ajaxurl' => admin_url('admin-ajax.php'),
			'template_directory' => get_bloginfo('template_directory'),
			'stylesheet_directory' => get_bloginfo('stylesheet_directory'),
			'plugins_url' => plugins_url(),
			'plugin_dir_url' => plugin_dir_url(__FILE__),
			'url' => get_bloginfo('url'),
			'logout_url' => wp_logout_url(),
			'show_login_messages' => get_option('whigi_show_login_messages'),
			'logged_in' => is_user_logged_in(),
		);
		wp_enqueue_script('whigi-cvars', plugins_url('/cvars.js', __FILE__));
		wp_localize_script('whigi-cvars', 'whigi_cvars', $whigi_cvars);
		//JQuery
		wp_enqueue_script('jquery');
		//Enqueue frontend
		wp_enqueue_script('whigi-script', plugin_dir_url(__FILE__) . 'whigi-wp.js', array());
		wp_enqueue_style('whigi-style', plugin_dir_url(__FILE__) . 'whigi-wp.css', array());
	}
	
	//Backend
	function whigi_init_backend_scripts_styles() {
		$whigi_cvars = array(
			//Basic info
			'ajaxurl' => admin_url('admin-ajax.php'),
			'template_directory' => get_bloginfo('template_directory'),
			'stylesheet_directory' => get_bloginfo('stylesheet_directory'),
			'plugins_url' => plugins_url(),
			'plugin_dir_url' => plugin_dir_url(__FILE__),
			'url' => get_bloginfo('url'),
			'show_login_messages' => get_option('whigi_show_login_messages'),
			'logged_in' => is_user_logged_in(),
		);
		wp_enqueue_script('whigi-cvars', plugins_url('/cvars.js', __FILE__));
		wp_localize_script('whigi-cvars', 'whigi_cvars', $whigi_cvars);
		//JQuery
		wp_enqueue_script('jquery');
		//Enqueue backend
		wp_enqueue_script('whigi-script', plugin_dir_url(__FILE__) . 'whigi-wp.js', array());
		wp_enqueue_style('whigi-style', plugin_dir_url(__FILE__) . 'whigi-wp.css', array());
		//Media screen
		wp_enqueue_media();
	}
	
	//Login
	function whigi_init_login_scripts_styles() {
		$whigi_cvars = array(
			//Basic info
			'ajaxurl' => admin_url('admin-ajax.php'),
			'template_directory' => get_bloginfo('template_directory'),
			'stylesheet_directory' => get_bloginfo('stylesheet_directory'),
			'plugins_url' => plugins_url(),
			'plugin_dir_url' => plugin_dir_url(__FILE__),
			'url' => get_bloginfo('url'),
			'login_message' => $_SESSION['WHIGI']['RESULT'],
			'show_login_messages' => get_option('whigi_show_login_messages'),
			'logged_in' => is_user_logged_in(),
		);
		wp_enqueue_script('whigi-cvars', plugins_url('/cvars.js', __FILE__));
		wp_localize_script('whigi-cvars', 'whigi_cvars', $whigi_cvars);
		//JQuery
		wp_enqueue_script('jquery');
		//Enqueue login
		wp_enqueue_script('whigi-script', plugin_dir_url(__FILE__) . 'whigi-wp.js', array());
		wp_enqueue_style('whigi-style', plugin_dir_url(__FILE__) . 'whigi-wp.css', array());
	}
	
	//Settings for admins
	function whigi_settings_link($links) {
		$settings_link = "<a href='options-general.php?page=Whigi-WP.php'>Settings</a>"; // CASE SeNsItIvE filename!
		array_unshift($links, $settings_link); 
		return $links; 
	}
	
	//Add basic auth to an URL
	function whigi_add_basic_auth($url, $username, $password) {
		$url = str_replace("https://", "", $url);
		$url = "https://" . $username . ":" . $password . "@" . $url;
		return $url;
	}

	function whigi_qvar_triggers($vars) {
		$vars[] = 'whigi-connect';
		$vars[] = 'whigi-grant';
		return $vars;
	}
	
	//Querystrings we registered
	function whigi_qvar_handlers() {
		if(get_query_var('whigi-connect') || get_query_var('whigi-grant')) {
			$this->whigi_include_connector();
		}
	}
	
	//Load the script of auth
	function whigi_include_connector() {
		include 'whigi-wp-callbacks.php';
	}
	
	//Match accounts
	function whigi_match_wordpress_user($identity) {
		global $wpdb;
		if(!get_option("users_can_register")) {
			return false;
		}
		//Attempt user creation
		$user_id = wp_create_user($identity["_id"], wp_generate_password(), $identity["_id"]);
		//User did not exist, update him first time
		if(!is_wp_error($user_id)) {
			wpdb->update($wpdb->users, array('user_login' => $identity["_id"], 'user_nicename' => $identity["_id"], 'display_name' => $identity["_id"]), array('ID' => $user_id));
			update_user_meta($user_id, 'nickname', $identity["_id"]);
		}

		$usermeta_table = $wpdb->usermeta;
		$query_string = "SELECT $usermeta_table.user_id FROM $usermeta_table WHERE $usermeta_table.meta_key = 'whigi_identity' AND $usermeta_table.meta_value LIKE '%" . $identity["_id"] . "%'";
		$query_result = $wpdb->get_var($query_string);
		$user = get_user_by('id', $query_result);
		return $user;
	}
	
	//Login a user, creating a fresh WP_User
	function whigi_login_user($identity) {
		//User _id
		$matched_user = $this->whigi_match_wordpress_user($identity);
		if($matched_user == false) {
			$this->whigi_end_login("Sorry, we couldn't log you in. Please notify the admin or try again later.");
			return;
		}
		$_SESSION["WHIGI"]["USER_ID"] = $identity["_id"];
		$user_id = $matched_user->ID;
		$user_login = $matched_user->user_login;
		wp_set_current_user($user_id, $user_login);
		wp_set_auth_cookie($user_id);
		do_action('wp_login', $user_login, $matched_user);
		$this->whigi_end_login("Logged in successfully!");
	}
	
	//OK login
	function whigi_end_login($msg) {
		$last_url = $_SESSION["WHIGI"]["LAST_URL"];
		unset($_SESSION["WHIGI"]["LAST_URL"]);
		$_SESSION["WHIGI"]["RESULT"] = $msg;
		$this->whigi_clear_login_state();

		$redirect_url = get_option('whigi_login_redirect_url');
		wp_safe_redirect($redirect_url);
		die();
	}
	
	//Log out
	function whigi_logout_user() {
		$user = null;
		session_destroy();
		//Calls whigi_end_logout
		wp_logout();
	}
	
	//OK logout
	function whigi_end_logout() {
		$_SESSION["WHIGI"]["RESULT"] = 'Logged out successfully.';
		if(is_user_logged_in()) {
			$last_url = $_SERVER['HTTP_REFERER'];
		} else {
			$last_url = strtok($_SERVER['HTTP_REFERER'], "?");
		}
		unset($_SESSION["WHIGI"]["LAST_URL"]);
		$this->whigi_clear_login_state();

		$redirect_url = get_option('whigi_logout_redirect_url');
		wp_safe_redirect($redirect_url);
		die();
	}
	
	//Link account
	function whigi_link_account($user_id) {
		if($_SESSION['WHIGI']['USER_ID'] != '') {
			add_user_meta($user_id, 'whigi_identity', $_SESSION['WHIGI']['USER_ID'] . '|' . time());
		}
	}
	
	//Login into DOM
	function whigi_push_login_messages() {
		$result = $_SESSION['WHIGI']['RESULT'];
		$_SESSION['WHIGI']['RESULT'] = '';
		echo "<div id='whigi-result'>" . $result . "</div>";
	}
	
	//Clear login state
	function whigi_clear_login_state() {
		unset($_SESSION["WHIGI"]["USER_ID"]);
		unset($_SESSION["WHIGI"]["STATE"]);
	}
	
	//Login by site, not on wordpress.org
	function whigi_logo_link() {
		return get_bloginfo('url');
	}
	
	//Show custom log in screen
	function whigi_customize_login_screen() {
		$html = $this->whigi_login_form_content($design, 'none', 'buttons-column', 'Connect with', 'center', 'conditional', 'conditional', 'Please login:', 'You are already logged in.', 'Logging in...', 'Logging out...');
		echo $html;
	}

	//Show log in above real login
	function whigi_customize_comment_form_fields($fields) {
		$html = $this->whigi_login_form_content($design, 'none', 'buttons-column', 'Connect with', 'center', 'conditional', 'conditional', 'Please login:', 'You are already logged in.', 'Logging in...', 'Logging out...');
		$fields['logged_in_as'] = $html;
		return $fields;
	}
	
	//Show log in above real login
	function whigi_customize_comment_form() {
		$html = $this->whigi_login_form_content($design, 'none', 'buttons-column', 'Connect with', 'center', 'conditional', 'conditional', 'Please login:', 'You are already logged in.', 'Logging in...', 'Logging out...');
		echo $html;
	}

	//Add the widget anywhere
	function whigi_login_form($atts){
		$a = shortcode_atts(array(
			'design' => '',
			'icon_set' => 'none',
			'button_prefix' => '',
			'layout' => 'links-column',
			'align' => 'left',
			'show_login' => 'conditional',
			'show_logout' => 'conditional',
			'logged_out_title' => 'Please login:',
			'logged_in_title' => 'You are already logged in.',
			'logging_in_title' => 'Logging in...',
			'logging_out_title' => 'Logging out...',
			'style' => '',
			'class' => '',
		), $atts);
		$html = $this->whigi_login_form_content($a['design'], $a['icon_set'], $a['layout'], $a['button_prefix'], $a['align'], $a['show_login'], $a['show_logout'], $a['logged_out_title'], $a['logged_in_title'], $a['logging_in_title'], $a['logging_out_title'], $a['style'], $a['class']);
		return $html;
	}
	
	// gets the content to be used for displaying the login/logout form:
	function whigi_login_form_content($design = '', $icon_set = 'icon_set', $layout = 'links-column', $button_prefix = '', $align = 'left', $show_login = 'conditional', $show_logout = 'conditional', $logged_out_title = 'Please login:', $logged_in_title = 'You are already logged in.', $logging_in_title = 'Logging in...', $logging_out_title = 'Logging out...', $style = '', $class = '') {
		if(WHIGI::whigi_login_form_design_exists($design)) {
			$a = WHIGI::whigi_get_login_form_design($design);
			$icon_set = $a['icon_set'];
			$layout = $a['layout'];
			$button_prefix = $a['button_prefix'];
			$align = $a['align'];
			$show_login = $a['show_login'];
			$show_logout = $a['show_logout'];
			$logged_out_title = $a['logged_out_title'];
			$logged_in_title = $a['logged_in_title'];
			$logging_in_title = $a['logging_in_title'];
			$logging_out_title = $a['logging_out_title'];
			$style = $a['style'];
			$class = $a['class'];
		}
		//Build HTML
		$html = "";
		$html .= "<div class='whigi-login-form whigi-layout-$layout whigi-layout-align-$align $class' style='$style' data-logging-in-title='$logging_in_title' data-logging-out-title='$logging_out_title'>";
		$html .= "<nav>";
		if(is_user_logged_in()) {
			if($logged_in_title) {
				$html .= "<p id='whigi-title'>" . $logged_in_title . "</p>";
			}
			if($show_login == 'always') {
				$html .= $this->whigi_login_buttons($icon_set, $button_prefix);
			}
			if($show_logout == 'always' || $show_logout == 'conditional') {
				$html .= "<a class='whigi-logout-button' href='" . wp_logout_url() . "' title='Logout'>Logout</a>";
			}
		}
		else {
			if($logged_out_title) {
				$html .= "<p id='whigi-title'>" . $logged_out_title . "</p>";
			}
			if($show_login == 'always' || $show_login == 'conditional') {
				$html .= $this->whigi_login_buttons($icon_set, $button_prefix);
			}
			if($show_logout == 'always') {
				$html .= "<a class='whigi-logout-button' href='" . wp_logout_url() . "' title='Logout'>Logout</a>";
			}
		}
		$html .= "</nav>";
		$html .= "</div>";
		return $html;
	}
	
	//Generate buttons
	function whigi_login_buttons($icon_set, $button_prefix) {
		$site_url = get_bloginfo('url');
		$redirect_to = urlencode($_GET['redirect_to']);
		if($redirect_to) {
			$redirect_to = "&redirect_to=" . $redirect_to;
		}
		$icon_set_path = plugins_url('icons/' . $icon_set . '/', __FILE__);
		$atts = array(
			'site_url' => $site_url,
			'redirect_to' => $redirect_to,
			'icon_set' => $icon_set,
			'icon_set_path' => $icon_set_path,
			'button_prefix' => $button_prefix,
		);
		$html = $this->whigi_login_button("whigi", "Whigi", $atts);
		return $html;
	}

	//Generate button
	function whigi_login_button($provider, $display_name, $atts) {
		$html = "";
		$html .= "<a id='whigi-login-" . $provider . "' class='whigi-login-button' href='" . $atts['site_url'] . "?connect=" . $provider . $atts['redirect_to'] . "'>";
		if($atts['icon_set'] != 'none') {
			$html .= "<img src='" . $atts['icon_set_path'] . $provider . ".png' alt='" . $display_name . "' class='icon'></img>";
		}
		$html .= $atts['button_prefix'] . " " . $display_name;
		$html .= "</a>";
		return $html;
	}
	
	//Generate form
	function whigi_login_form_designs_selector($id = '', $master = false) {
		$html = "";
		$designs_array = array();
		$name = str_replace('-', '_', $id);
		$html .= "<select id='" . $id . "' name='" . $name . "'>";
		if($master == true) {
			foreach($designs_array as $key => $val) {
				$html .= "<option value=''>" . $key . "</option>";
			}
			$html .= "</select>";
			$html .= "<input type='hidden' id='whigi-login-form-designs' name='whigi_login_form_designs' value='" . $designs_json . "'>";
		}
		else {
			$html .= "<option value='None'>" . 'None' . "</option>";
			foreach($designs_array as $key => $val) {
				$html .= "<option value='" . $key . "' " . selected(get_option($name), $key, false) . ">" . $key . "</option>";
			}
			$html .= "</select>";
		}
		return $html;
	}
	
	//Get design
	function whigi_get_login_form_design($design_name, $as_string = false) {
		$atts;
		return $atts;
	}
	
	function whigi_login_form_design_exists($design_name) {
		return false;
	}
	
	//Show linked account
	function whigi_linked_accounts() {
		global $current_user;
		get_currentuserinfo();
		$user_id = $current_user->ID;
		//Get the whigi_identity records:
		global $wpdb;
		$usermeta_table = $wpdb->usermeta;
		$query_string = "SELECT * FROM $usermeta_table WHERE $user_id = $usermeta_table.user_id AND $usermeta_table.meta_key = 'whigi_identity'";
		$query_result = $wpdb->get_results($query_string);
		//List the whigi_identity records:
		echo "<div id='whigi-linked-accounts'>";
		echo "<h3>Linked Accounts</h3>";
		echo "<table class='form-table'>";
		echo "<tr valign='top'>";
		echo "<th scope='row'>Your Linked Account</th>";
		echo "<td>";
		echo "<div class='whigi-linked-accounts'>";
		foreach ($query_result as $whigi_row) {
			$whigi_identity_parts = explode('|', $whigi_row->meta_value);
			$linked_id = $whigi_identity_parts[0];
			$time_linked = $whigi_identity_parts[1];
			$local_time = strtotime("-" . $_COOKIE['gmtoffset'] . ' hours', $time_linked);
			echo "<div>" . $linked_in . " on " . date('F d, Y h:i A', $local_time) . "</div>";
		}
		echo "</div>";
		echo "</td>";
		echo "</tr>";
		echo "</table>";
	}
	
	//Admin settings page
	function whigi_register_settings() {
		foreach ($this->settings as $setting_name => $default_value) {
			register_setting('whigi_settings', $setting_name);
		}
	}
	
	//Our settings
	function whigi_settings_page() {
		add_options_page('Whigi-WP Options', 'Whigi-WP', 'manage_options', 'Whigi-WP', array($this, 'whigi_settings_page_content'));
	}

	//Generate page
	function whigi_settings_page_content() {
		if(!current_user_can('manage_options'))  {
			wp_die(__('You do not have sufficient permissions to access this page.'));
		}
		$blog_url = rtrim(site_url(), "/") . "/";
		include 'whigi-wp-settings.php';
	}
}

//Singleton
WHIGI::get_instance();
?>