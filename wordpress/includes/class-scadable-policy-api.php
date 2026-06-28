<?php
/**
 * SCADABLE Policy API client.
 *
 * Talks to the public SCADABLE policy API and caches successful responses
 * in a transient, so each page view renders the always-current document
 * without hitting the API every time.
 *
 * @package Scadable_Policy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Scadable_Policy_API {

	/** Base URL of the public SCADABLE API. */
	const API_BASE = 'https://api.scadable.com';

	/** How long to cache a fetched document, in seconds (one hour). */
	const CACHE_TTL = 3600;

	/** Prefix shared by all of our transient cache keys. */
	const CACHE_PREFIX = 'scadable_policy_';

	/**
	 * Document types this plugin supports, mapped to a human label.
	 *
	 * @return array<string,string>
	 */
	public static function doc_types() {
		return array(
			'privacy_policy' => __( 'Privacy policy', 'scadable-policy' ),
			'terms_of_use'   => __( 'Terms of use', 'scadable-policy' ),
		);
	}

	/**
	 * Normalise a doc type to one we support, defaulting to privacy_policy.
	 *
	 * @param mixed $doc_type Raw doc type value.
	 * @return string
	 */
	public static function normalize_doc_type( $doc_type ) {
		$doc_type = is_string( $doc_type ) ? strtolower( trim( $doc_type ) ) : '';
		return array_key_exists( $doc_type, self::doc_types() ) ? $doc_type : 'privacy_policy';
	}

	/**
	 * Build the transient cache key for a token + doc type pair.
	 *
	 * @param string $token    SCADABLE token.
	 * @param string $doc_type Normalised doc type.
	 * @return string
	 */
	public static function cache_key( $token, $doc_type ) {
		return self::CACHE_PREFIX . md5( $token . '|' . $doc_type );
	}

	/**
	 * Fetch a published policy document.
	 *
	 * Returns the decoded JSON payload (html, version, updated_at, doc_type,
	 * scope_name, domain, effective_date) on success, or a WP_Error on
	 * failure. Successful responses are cached for CACHE_TTL seconds.
	 *
	 * @param string $token    SCADABLE token.
	 * @param string $doc_type Doc type ("privacy_policy" or "terms_of_use").
	 * @return array|WP_Error
	 */
	public static function fetch( $token, $doc_type ) {
		$token    = is_string( $token ) ? trim( $token ) : '';
		$doc_type = self::normalize_doc_type( $doc_type );

		if ( '' === $token ) {
			return new WP_Error(
				'scadable_policy_missing_token',
				__( 'No SCADABLE token was provided.', 'scadable-policy' )
			);
		}

		$cache_key = self::cache_key( $token, $doc_type );
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$url = add_query_arg(
			array(
				'doc_type' => $doc_type,
				'format'   => 'json',
			),
			self::API_BASE . '/policy/' . rawurlencode( $token )
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout'    => 10,
				'headers'    => array( 'Accept' => 'application/json' ),
				'user-agent' => 'scadable-wordpress/' . SCADABLE_POLICY_VERSION . '; ' . home_url( '/' ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'scadable_policy_request_failed',
				__( 'Could not reach the SCADABLE service.', 'scadable-policy' ),
				array( 'detail' => $response->get_error_message() )
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( 200 !== $code ) {
			// The API returns a helpful {"detail": "..."} body on errors.
			$detail = ( is_array( $data ) && isset( $data['detail'] ) )
				? $data['detail']
				: sprintf( 'HTTP %d', $code );

			return new WP_Error(
				'scadable_policy_http_error',
				__( 'The SCADABLE service returned an error.', 'scadable-policy' ),
				array(
					'detail' => $detail,
					'status' => $code,
				)
			);
		}

		if ( ! is_array( $data ) || ! isset( $data['html'] ) ) {
			return new WP_Error(
				'scadable_policy_bad_payload',
				__( 'The SCADABLE service returned an unexpected response.', 'scadable-policy' )
			);
		}

		// Cache only successful responses, so a transient outage is retried
		// on the next page view rather than being pinned for an hour.
		set_transient( $cache_key, $data, self::CACHE_TTL );

		return $data;
	}

	/**
	 * Clear the cached copy for a single token + doc type.
	 *
	 * @param string $token    SCADABLE token.
	 * @param string $doc_type Doc type.
	 */
	public static function clear_cache( $token, $doc_type ) {
		delete_transient(
			self::cache_key( trim( (string) $token ), self::normalize_doc_type( $doc_type ) )
		);
	}

	/**
	 * Clear the cached copy for a token across every supported doc type.
	 *
	 * @param string $token SCADABLE token.
	 */
	public static function clear_cache_for_token( $token ) {
		foreach ( array_keys( self::doc_types() ) as $doc_type ) {
			self::clear_cache( $token, $doc_type );
		}
	}
}
