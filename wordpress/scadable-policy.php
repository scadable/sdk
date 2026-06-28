<?php
/**
 * Plugin Name:       SCADABLE Privacy & Terms
 * Plugin URI:        https://scadable.com
 * Description:       Display your always-current privacy policy and terms of use, pulled live from SCADABLE. Enter one token and you are done. The document renders server-side for clean SEO and updates itself whenever you publish a new version.
 * Version:           0.1.0
 * Requires at least: 5.8
 * Requires PHP:      7.2
 * Author:            SCADABLE
 * Author URI:        https://scadable.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       scadable-policy
 * Domain Path:       /languages
 *
 * @package Scadable_Policy
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SCADABLE_POLICY_VERSION', '0.1.0' );
define( 'SCADABLE_POLICY_FILE', __FILE__ );
define( 'SCADABLE_POLICY_DIR', plugin_dir_path( __FILE__ ) );
define( 'SCADABLE_POLICY_URL', plugin_dir_url( __FILE__ ) );

require_once SCADABLE_POLICY_DIR . 'includes/class-scadable-policy-api.php';
require_once SCADABLE_POLICY_DIR . 'includes/class-scadable-policy-settings.php';
require_once SCADABLE_POLICY_DIR . 'includes/class-scadable-policy-renderer.php';

/**
 * Boot the plugin once WordPress core has loaded.
 *
 * Registers the settings page, the [scadable_policy] shortcode and the
 * "SCADABLE Policy" block. All three share one renderer, so the output is
 * identical however the document is embedded.
 */
function scadable_policy_bootstrap() {
	Scadable_Policy_Settings::register();
	Scadable_Policy_Renderer::register();
}
add_action( 'plugins_loaded', 'scadable_policy_bootstrap' );
