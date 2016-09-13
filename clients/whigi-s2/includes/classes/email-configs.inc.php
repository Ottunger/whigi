<?php
/**
* Email configurations for s2Member.
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
* @package s2Member\Email_Configs
* @since 3.5
*/
if(!defined('WPINC')) // MUST have WordPress.
	exit ('Do not access this file directly.');

if (!class_exists ('c_ws_plugin__s2member_email_configs'))
	{
		/**
		* Email configurations for s2Member.
		*
		* @package s2Member\Email_Configs
		* @since 3.5
		*/
		class c_ws_plugin__s2member_email_configs
			{
				/**
				* Modifies email From: `"Name" <address>`.
				*
				* These Filters are only needed during registration.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*/
				public static function email_config ()
					{
						do_action('ws_plugin__s2member_before_email_config', get_defined_vars ());

						c_ws_plugin__s2member_email_configs::email_config_release ();

						add_filter ('wp_mail_from', 'c_ws_plugin__s2member_email_configs::_email_config_email');
						add_filter ('wp_mail_from_name', 'c_ws_plugin__s2member_email_configs::_email_config_name');

						do_action('ws_plugin__s2member_after_email_config', get_defined_vars ());
					}

				/**
				* A sort of callback function that applies the email Filter.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*
				* @attaches-to ``add_filter('wp_mail_from');``
				*
				* @param string $email Expects the email address to be passed in by the Filter.
				* @return string s2Member-configured email address.
				*/
				public static function _email_config_email ($email = '')
					{
						do_action('_ws_plugin__s2member_before_email_config_email', get_defined_vars ());

						return apply_filters('_ws_plugin__s2member_email_config_email', $GLOBALS['WS_PLUGIN__']['s2member']['o']['reg_email_from_email'], get_defined_vars ());
					}

				/**
				* A sort of callback function that applies the name Filter.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*
				* @attaches-to ``add_filter('wp_mail_from_name');``
				*
				* @param string $name Expects the name to be passed in by the Filter.
				* @return string s2Member-configured name.
				*/
				public static function _email_config_name ($name = '')
					{
						do_action('_ws_plugin__s2member_before_email_config_name', get_defined_vars ());

						return apply_filters('_ws_plugin__s2member_email_config_name', $GLOBALS['WS_PLUGIN__']['s2member']['o']['reg_email_from_name'], get_defined_vars ());
					}

				/**
				* Checks the status of Filters being applied to the email From: "Name" <address>.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*
				* @param bool $any Optional. Defaults to false. If true, return true if ANY Filters are being applied, not just those applied by s2Member.
				* @return bool True if Filters are being applied, else false.
				*/
				public static function email_config_status ($any = FALSE)
					{
						do_action('ws_plugin__s2member_before_email_config_status', get_defined_vars ());

						if (has_filter ('wp_mail_from', 'c_ws_plugin__s2member_email_configs::_email_config_email') || has_filter ('wp_mail_from_name', 'c_ws_plugin__s2member_email_configs::_email_config_name'))
							return apply_filters('ws_plugin__s2member_email_config_status', true, get_defined_vars ());

						else if ($any && (has_filter ('wp_mail_from') || has_filter ('wp_mail_from_name')))
							return apply_filters('ws_plugin__s2member_email_config_status', true, get_defined_vars ());

						return apply_filters('ws_plugin__s2member_email_config_status', false, get_defined_vars ());
					}

				/**
				* Releases Filters that modify the email From: "Name" <address>.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*
				* @param bool $all Optional. Defaults to false. If true, remove ALL Filters, not just those applied by s2Member.
				*/
				public static function email_config_release ($all = FALSE)
					{
						do_action('ws_plugin__s2member_before_email_config_release', get_defined_vars ());

						remove_filter ('wp_mail_from', 'c_ws_plugin__s2member_email_configs::_email_config_email');
						remove_filter ('wp_mail_from_name', 'c_ws_plugin__s2member_email_configs::_email_config_name');

						if ($all) // If ``$all`` is true, remove ALL attached WordPress Filters.
							remove_all_filters ('wp_mail_from') . remove_all_filters ('wp_mail_from_name');

						do_action('ws_plugin__s2member_after_email_config_release', get_defined_vars ());
					}

				/**
				* Converts primitive Role names in emails sent by WordPress.
				*
				* Only necessary with this particular email: `wpmu_signup_user_notification_email`.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*
				* @attaches-to ``add_filter('wpmu_signup_user_notification_email');``
				*
				* @param string $message Expects the message string to be passed in by the Filter.
				* @return string Message after having been Filtered by s2Member.
				*/
				public static function ms_nice_email_roles ($message = '')
					{
						foreach(array_keys(get_defined_vars())as$__v)$__refs[$__v]=&$$__v;
						do_action('ws_plugin__s2member_before_ms_nice_email_roles', get_defined_vars ());
						unset($__refs, $__v); // Housekeeping.

						$message = preg_replace ('/ as a (subscriber|s2member_level[0-9]+)/i', ' ' . _x ('as a Member', 's2member-front', 's2member'), $message);

						return apply_filters('ws_plugin__s2member_ms_nice_email_roles', $message, get_defined_vars ());
					}

				/**
				* Filters email addresses passed to ``wp_mail()``.
				*
				* @package s2Member\Email_Configs
				* @since 3.5
				*
				* @attaches-to ``add_filter('wp_mail');``
				* @uses {@link s2Member\Utilities\c_ws_plugin__s2member_utils_strings::parse_emails()}
				*
				* @param array $array Expects an array passed through by the Filter.
				* @return array Returns the array passed through by the Filter.
				*/
				public static function email_filter ($array = array())
					{
						if (isset ($array['to']) && !empty($array['to'])) // Filter list of recipients?
							// Reduces `"Name" <email>`, to just an email address *(for best cross-platform compatibility across various MTAs)*.
							// Also works around bug in PHP versions prior to fix in 5.2.11. See bug report: <https://bugs.php.net/bug.php?id=28038>.
							// Also supplements WordPress. WordPress currently does NOT support semicolon `;` delimitation, s2Member does.
							$array['to'] = implode (',', c_ws_plugin__s2member_utils_strings::parse_emails ($array['to']));

						return apply_filters('ws_plugin__s2member_after_email_filter', $array, get_defined_vars ());
					}
