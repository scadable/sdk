<?php
/**
 * Shortcode and Gutenberg block that render a SCADABLE policy.
 *
 * Both entry points share one render() method, so the output is identical
 * whichever way the document is embedded. Rendering happens server-side, so
 * the policy text is present in the page's HTML for clean SEO.
 *
 * @package Scadable_Policy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Scadable_Policy_Renderer {

	/** Registered handle for the block editor script. */
	const EDITOR_HANDLE = 'scadable-policy-editor';

	/** Wire up the shortcode and the block. */
	public static function register() {
		add_shortcode( 'scadable_policy', array( __CLASS__, 'shortcode' ) );
		add_action( 'init', array( __CLASS__, 'register_block' ) );
	}

	/**
	 * Shortcode: [scadable_policy token="..." doc_type="privacy_policy"].
	 *
	 * Both attributes are optional. The token falls back to the saved
	 * setting and the doc type to the saved default.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string
	 */
	public static function shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'token'    => '',
				'doc_type' => '',
			),
			$atts,
			'scadable_policy'
		);

		return self::render( $atts['token'], $atts['doc_type'] );
	}

	/** Register the dynamic, server-side rendered block. */
	public static function register_block() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return; // Block editor not available (very old WordPress).
		}

		// Register the editor script by hand so the plugin needs no build
		// step. The script is plain ES5 using the global wp.* packages.
		wp_register_script(
			self::EDITOR_HANDLE,
			SCADABLE_POLICY_URL . 'blocks/policy/index.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render', 'wp-i18n' ),
			SCADABLE_POLICY_VERSION,
			true
		);

		// block.json supplies the metadata; the PHP render_callback supplies
		// the server-side output (so the block is SEO clean, not client only).
		register_block_type(
			SCADABLE_POLICY_DIR . 'blocks/policy',
			array( 'render_callback' => array( __CLASS__, 'render_block' ) )
		);
	}

	/**
	 * Block render callback. Maps block attributes onto render().
	 *
	 * @param array $attributes Block attributes (token, docType).
	 * @return string
	 */
	public static function render_block( $attributes ) {
		$token    = isset( $attributes['token'] ) ? $attributes['token'] : '';
		$doc_type = isset( $attributes['docType'] ) ? $attributes['docType'] : '';
		return self::render( $token, $doc_type );
	}

	/**
	 * Shared renderer. Always returns an HTML string and never throws.
	 *
	 * Falls back to the saved token and default doc type when the caller
	 * leaves them blank, so a bare block or [scadable_policy] just works
	 * once the token is set in Settings.
	 *
	 * @param string $token    SCADABLE token (may be blank).
	 * @param string $doc_type Doc type (may be blank).
	 * @return string
	 */
	public static function render( $token, $doc_type ) {
		$token = is_string( $token ) ? trim( $token ) : '';
		if ( '' === $token ) {
			$token = Scadable_Policy_Settings::get_token();
		}

		$doc_type = is_string( $doc_type ) ? trim( $doc_type ) : '';
		if ( '' === $doc_type ) {
			$doc_type = Scadable_Policy_Settings::get_default_doc_type();
		}
		$doc_type = Scadable_Policy_API::normalize_doc_type( $doc_type );

		if ( '' === $token ) {
			// No token anywhere. Nudge admins, stay silent for visitors.
			if ( current_user_can( 'manage_options' ) ) {
				return self::notice( __( 'Set your SCADABLE token in Settings -> SCADABLE to display your policy.', 'scadable-policy' ) );
			}
			return '';
		}

		$data = Scadable_Policy_API::fetch( $token, $doc_type );

		if ( is_wp_error( $data ) ) {
			return self::error( $data );
		}

		// The html field is a trusted, self-contained fragment from our own
		// first-party API: it carries its own <style> and the scadable.com
		// backlink. We output it as-is rather than running it through
		// wp_kses, which would strip the styling.
		return '<div class="scadable-policy-embed">' . $data['html'] . '</div>';
	}

	/**
	 * A small neutral message wrapper (admin nudges).
	 *
	 * @param string $text Already-translated text.
	 * @return string
	 */
	private static function notice( $text ) {
		return '<p class="scadable-policy-notice">' . esc_html( $text ) . '</p>';
	}

	/**
	 * Friendly error output. Visitors see a neutral line; admins also get
	 * the underlying detail so they can correct the token quickly.
	 *
	 * @param WP_Error $error The error from the API client.
	 * @return string
	 */
	private static function error( WP_Error $error ) {
		$message = __( 'This policy is temporarily unavailable.', 'scadable-policy' );

		if ( current_user_can( 'manage_options' ) ) {
			$data   = $error->get_error_data();
			$detail = ( is_array( $data ) && isset( $data['detail'] ) )
				? $data['detail']
				: $error->get_error_message();
			$message .= ' (' . $detail . ')';
		}

		return '<p class="scadable-policy-error">' . esc_html( $message ) . '</p>';
	}
}
