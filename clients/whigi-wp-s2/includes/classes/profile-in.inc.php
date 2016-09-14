<?php
/**
 * s2Member Stand-Alone Profile page (inner processing routines).
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
 * @package s2Member\Profiles
 * @since 3.5
 */
if(!defined('WPINC')) // MUST have WordPress.
	exit ('Do not access this file directly.');

if(!class_exists('c_ws_plugin__s2member_profile_in'))
{
	/**
	 * s2Member Stand-Alone Profile page (inner processing routines).
	 *
	 * @package s2Member\Profiles
	 * @since 3.5
	 */
	class c_ws_plugin__s2member_profile_in
	{
		/**
		 * Displays a Stand-Alone Profile Modification Form.
		 *
		 * @package s2Member\Profiles
		 * @since 3.5
		 *
		 * @attaches-to ``add_action("init");``
		 */
		public static function profile()
		{
			do_action('ws_plugin__s2member_before_profile', get_defined_vars());

			if(!empty($_GET['s2member_profile'])) // Requesting Profile?
			{
				c_ws_plugin__s2member_no_cache::no_cache_constants(TRUE); // No caching.

				$tabindex = apply_filters('ws_plugin__s2member_sc_profile_tabindex', 0, get_defined_vars());

				if(($user = (is_user_logged_in()) ? wp_get_current_user() : FALSE) && ($user_id = $user->ID))
				{
					echo c_ws_plugin__s2member_utils_html::doctype_html_head('My Profile', 'ws_plugin__s2member_during_profile_head');

					echo '<body style="'.esc_attr(apply_filters('ws_plugin__s2member_profile_body_styles', "background:#FFFFFF; color:#333333; font-family:'Verdana', sans-serif; font-size:13px;", get_defined_vars())).'">'."\n";

					echo '<form method="post" name="ws_plugin__s2member_profile" id="ws-plugin--s2member-profile" action="'.esc_attr(home_url('/')).'" autocomplete="off">'."\n";

					foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
					do_action('ws_plugin__s2member_during_profile_before_table', get_defined_vars());
					unset($__refs, $__v);

					echo '<table cellpadding="0" cellspacing="0">'."\n";
					echo '<tbody>'."\n";

					foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
					do_action('ws_plugin__s2member_during_profile_before_fields', get_defined_vars());
					unset($__refs, $__v);

					if(apply_filters('ws_plugin__s2member_during_profile_during_fields_display_username', TRUE, get_defined_vars()))
					{
						foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
						do_action('ws_plugin__s2member_during_profile_during_fields_before_username', get_defined_vars());
						unset($__refs, $__v);

						echo '<tr>'."\n";
						echo '<td>'."\n";
						echo '<label for="ws-plugin--s2member-profile-login">'."\n";
						echo '<strong>'._x('Username', 's2member-front', 's2member').' *</strong> <small>'._x('(cannot be changed)', 's2member-front', 's2member').'</small><br />'."\n";
						echo '<input type="text" aria-required="true" maxlength="60" autocomplete="off" name="ws_plugin__s2member_profile_login" id="ws-plugin--s2member-profile-login" class="ws-plugin--s2member-profile-field form-control" value="'.format_to_edit($user->user_login).'" disabled="disabled" />'."\n";
						echo '</label>'."\n";
						echo '</td>'."\n";
						echo '</tr>'."\n";

						foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
						do_action('ws_plugin__s2member_during_profile_during_fields_after_username', get_defined_vars());
						unset($__refs, $__v);
					}
					if($GLOBALS['WS_PLUGIN__']['s2member']['o']['custom_reg_opt_in'] && c_ws_plugin__s2member_list_servers::list_servers_integrated())
					{
						foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
						do_action('ws_plugin__s2member_during_profile_during_fields_before_opt_in', get_defined_vars());
						unset($__refs, $__v);

						echo '<tr><td><div class="ws-plugin--s2member-profile-field-divider-section"></div></td></tr>';

						echo '<tr>'."\n";
						echo '<td>'."\n";
						echo '<label for="ws-plugin--s2member-profile-opt-in">'."\n";
						echo '<input type="checkbox" name="ws_plugin__s2member_profile_opt_in" id="ws-plugin--s2member-profile-opt-in" class="ws-plugin--s2member-profile-field" value="1"'.((get_user_option('s2member_opt_in', $user_id)) ? ' checked="checked"' : '').' tabindex="'.esc_attr(($tabindex = $tabindex + 10)).'" />'."\n";
						echo $GLOBALS['WS_PLUGIN__']['s2member']['o']['custom_reg_opt_in_label']."\n";
						echo '</label>'."\n";
						echo '</td>'."\n";
						echo '</tr>'."\n";

						foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
						do_action('ws_plugin__s2member_during_profile_during_fields_after_opt_in', get_defined_vars());
						unset($__refs, $__v);
					}
					foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
					do_action('ws_plugin__s2member_during_profile_after_fields', get_defined_vars());
					unset($__refs, $__v);

					echo '<tr>'."\n";
					echo '<td>'."\n";
					echo '<input type="hidden" name="ws_plugin__s2member_profile_save" id="ws-plugin--s2member-profile-save" value="'.esc_attr(wp_create_nonce('ws-plugin--s2member-profile-save')).'" />'."\n";
					echo '<input type="submit" id="ws-plugin--s2member-profile-submit" class="btn btn-primary" value="'.esc_attr(_x('Save All Changes', 's2member-front', 's2member')).'" tabindex="'.esc_attr(($tabindex = $tabindex + 10)).'" />'."\n";
					echo '</td>'."\n";
					echo '</tr>'."\n";

					echo '</tbody>'."\n";
					echo '</table>'."\n";

					foreach(array_keys(get_defined_vars()) as $__v) $__refs[$__v] =& $$__v;
					do_action('ws_plugin__s2member_during_profile_after_table', get_defined_vars());
					unset($__refs, $__v);

					echo '</form>'."\n";

					echo '</body>'."\n";
					echo '</html>';
				}
				exit();
			}
			do_action('ws_plugin__s2member_after_profile', get_defined_vars());
		}
	}
}