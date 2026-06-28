<?php
/**
 * Uninstall cleanup for SCADABLE Privacy & Terms.
 *
 * Runs when the plugin is deleted from the WordPress admin. Removes the two
 * stored options and any cached policy transients.
 *
 * @package Scadable_Policy
 */

// Only run in a genuine uninstall context.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'scadable_policy_token' );
delete_option( 'scadable_policy_default_doc_type' );

// Remove cached policy transients. Their option_names are prefixed
// scadable_policy_ (with the _transient_ / _transient_timeout_ wrappers).
// Note: this targets the database; sites on an external object cache evict
// their own transients on expiry.
global $wpdb;

$like         = $wpdb->esc_like( '_transient_scadable_policy_' ) . '%';
$like_timeout = $wpdb->esc_like( '_transient_timeout_scadable_policy_' ) . '%';

$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
		$like,
		$like_timeout
	)
);
