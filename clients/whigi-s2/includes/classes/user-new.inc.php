<?php
/**
* New User handlers.
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
* @package s2Member\New_Users
* @since 3.5
*/
if(!defined('WPINC')) // MUST have WordPress.
	exit ("Do not access this file directly.");

if (!class_exists ("c_ws_plugin__s2member_user_new"))
	{
		/**
		* New User handlers.
		*
		* @package s2Member\New_Users
		* @since 3.5
		*/
		class c_ws_plugin__s2member_user_new
			{
				/**
				* Adds Custom Fields to `/wp-admin/user-new.php`.
				*
				* We have to buffer because `/user-new.php` has NO Hooks.
				*
				* @package s2Member\New_Users
				* @since 3.5
				*
				* @attaches-to ``add_action("load-user-new.php");``
				*
				* @return null
				*/
				public static function admin_user_new_fields ()
					{
						while(@ob_end_clean());
						header('Location: /wp-admin?whigi-deactivated='.urlencode('Disabled functionality')):
					}
			}
	}
