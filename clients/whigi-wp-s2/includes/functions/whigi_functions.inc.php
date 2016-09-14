<?php

if(!defined('WPINC')) // MUST have WordPress.
	exit("Do not access this file directly.");

if(!function_exists('s2member_whigi_get')) {
    function s2member_whigi_get($user_id, $meta_key) {
        $q = WHIGI::get_instance()->whigi_hook_get_user_meta(null, $user_id, $meta_key, true);
        if($q == WHIGI::NONE)
            return FALSE;
        return $q;
    }
}

if(!function_exists('s2member_whigi_get_current')) {
    function s2member_whigi_get_current($meta_key) {
        global $current_user;
        get_currentuserinfo();
        return s2member_whigi_get($current_user->ID, $meta_key);
    }
}

$opt = get_option('whigi_whigi_data');
if(!preg_match("/.*profile\/email.*/", $opt))
    update_option('whigi_whigi_data', $opt . '//profile/email');
if(!preg_match("/.*profile\/last_name.*/", $opt))
    update_option('whigi_whigi_data', $opt . '//profile/last_name');
if(!preg_match("/.*profile\/first_name.*/", $opt))
    update_option('whigi_whigi_data', $opt . '//profile/first_name');
if(!preg_match("/.*profile\/address.*/", $opt))
    update_option('whigi_whigi_data', $opt . '//profile/address');