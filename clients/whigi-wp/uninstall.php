<?php

//Can execute but in WP
if(!defined('WP_UNINSTALL_PLUGIN')) {
	exit();
}

//Delete what is asked
global $wpdb;
$delete_settings = $wpdb->get_var("SELECT option_value FROM $wpdb->options WHERE option_name = 'whigi_delete_settings_on_uninstall'");
if($delete_settings) {
	$wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE 'whigi_%';");
	$wpdb->query("DELETE FROM $wpdb->usermeta WHERE meta_key LIKE 'whigi_%';");
}

?>