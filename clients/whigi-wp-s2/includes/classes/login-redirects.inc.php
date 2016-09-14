<?php
/**
 * Login redirections.
 *
 * Copyright: © 2009-2011
 * {@link http://websharks-inc.com/ WebSharks, Inc.}
 * (coded in the USA)
 *
 * Released under the terms of the GNU General Public License.
 * You should have received a copy of the GNU General Public License,
 * along with this software. In the main directory, see: /licensing/
 * If not, see: {@link http://www.gnu.org/licenses/}.
 *
 * @package s2Member\Login_Redirects
 * @since 3.5
 */
if(!defined('WPINC')) // MUST have WordPress.
	exit ('Do not access this file directly.');

if(!class_exists('c_ws_plugin__s2member_login_redirects'))
{
	/**
	 * Login redirections.
	 *
	 * @package s2Member\Login_Redirects
	 * @since 3.5
	 */
	class c_ws_plugin__s2member_login_redirects
	{
		/**
		 * Parses a Special Login Redirection URL.
		 *
		 * @package s2Member\Login_Redirects
		 * @since 3.5
		 *
		 * @param object $user Optional. A WP_User object. Defaults to the current User, if logged-in.
		 * @param bool   $root_returns_false Defaults to false. True if the function should return false when a URL is reduced to the site root.
		 *
		 * @return string|bool A Special Login Redirection URL with Replacement Codes having been parsed, or false if ``$root_returns_false = true`` and the URL is the site root.
		 */
		public static function login_redirection_url($user = NULL, $root_returns_false = FALSE)
		{
			foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
			do_action('ws_plugin__s2member_before_login_redirection_url', get_defined_vars());
			unset($__refs, $__v); // Housekeeping.

			$url = $GLOBALS['WS_PLUGIN__']['s2member']['o']['login_redirection_override'];
			$url = c_ws_plugin__s2member_login_redirects::fill_login_redirect_rc_vars($url, $user, $root_returns_false);

			return apply_filters('ws_plugin__s2member_login_redirection_url', $url, get_defined_vars());
		}

		/**
		 * Parses a Special Login Redirection URI.
		 *
		 * @package s2Member\Login_Redirects
		 * @since 3.5
		 *
		 * @param object $user Optional. A WP_User object. Defaults to the current User, if logged-in.
		 * @param bool   $root_returns_false Defaults to false. True if the function should return false when a URI is reduced to the site root.
		 *
		 * @return string|bool A Special Login Redirection URI with Replacement Codes having been parsed, or false if ``$root_returns_false = true`` and the URI is the site root.
		 */
		public static function login_redirection_uri($user = NULL, $root_returns_false = FALSE)
		{
			foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
			do_action('ws_plugin__s2member_before_login_redirection_uri', get_defined_vars());
			unset($__refs, $__v); // Housekeeping.

			if(($url = c_ws_plugin__s2member_login_redirects::login_redirection_url($user, $root_returns_false)))
				$uri = c_ws_plugin__s2member_utils_urls::parse_uri($url);

			return apply_filters('ws_plugin__s2member_login_redirection_uri', !empty($uri) ? $uri : FALSE, get_defined_vars());
		}

		/**
		 * Fills Replacement Codes in Special Redirection URLs.
		 *
		 * @package s2Member\Login_Redirects
		 * @since 3.5
		 *
		 * @param string $url A URL with possible Replacement Codes in it.
		 * @param object $user Optional. A `WP_User` object. Defaults to the current User, if logged-in.
		 * @param bool   $root_returns_false Defaults to false. True if the function should return false when a URL is reduced to the site root.
		 *
		 * @return string|bool A Special Login Redirection URL with Replacement Codes having been parsed, or false if ``$root_returns_false = true`` and the URL is the site root.
		 */
		public static function fill_login_redirect_rc_vars($url = '', $user = NULL, $root_returns_false = FALSE)
		{
			foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
			do_action('ws_plugin__s2member_before_fill_login_redirect_rc_vars', get_defined_vars());
			unset($__refs, $__v); // Housekeeping.

			$url      = (string)$url; // Force ``$url`` to a string value.
			$orig_url = $url; // Record the original URL that was passed in.

			$user = (is_object($user) || is_object($user = wp_get_current_user()))
			        && !empty($user->ID) ? $user : NULL;

			$user_id       = ($user) ? (string)$user->ID : '';
			$user_login    = ($user) ? (string)strtolower($user->user_login) : '';
			$user_nicename = ($user) ? (string)strtolower($user->user_nicename) : '';

			$user_level  = (string)c_ws_plugin__s2member_user_access::user_access_level($user);
			$user_role   = (string)c_ws_plugin__s2member_user_access::user_access_role($user);
			$user_ccaps  = (string)implode('-', c_ws_plugin__s2member_user_access::user_access_ccaps($user));
			$user_logins = ($user) ? (string)(int)get_user_option('s2member_login_counter', $user_id) : '-1';

			$url = preg_replace('/%%current_user_login%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_login)), $url);
			$url = preg_replace('/%%current_user_nicename%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_nicename)), $url);
			$url = preg_replace('/%%current_user_id%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_id)), $url);
			$url = preg_replace('/%%current_user_level%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_level)), $url);
			$url = preg_replace('/%%current_user_role%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_role)), $url);
			$url = preg_replace('/%%current_user_ccaps%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_ccaps)), $url);
			$url = preg_replace('/%%current_user_logins%%/i', c_ws_plugin__s2member_utils_strings::esc_refs(urlencode($user_logins)), $url);

			if($url !== $orig_url && (!($parse = c_ws_plugin__s2member_utils_urls::parse_url($url, -1, FALSE)) || (!empty($parse['path']) && strpos($parse['path'], '//') !== FALSE)))
				$url = home_url('/'); // Defaults to Home Page. We don't return invalid URLs produced by empty Replacement Codes ( i.e., with `//` ).

			if($root_returns_false && c_ws_plugin__s2member_utils_conds::is_site_root($url)) // Used by s2Member's security gate.
				$url = FALSE; // In case we need to return false on root URLs (i.e., don't protect the Home Page inadvertently).

			return apply_filters('ws_plugin__s2member_fill_login_redirect_rc_vars', $url, get_defined_vars());
		}
	}
}
