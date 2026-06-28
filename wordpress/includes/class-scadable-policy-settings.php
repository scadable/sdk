<?php
/**
 * SCADABLE Policy settings page (Settings -> SCADABLE).
 *
 * Zero friction: one required field, the SCADABLE token. Optionally a
 * default document type. That is the whole setup.
 *
 * @package Scadable_Policy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Scadable_Policy_Settings {

	const PAGE_SLUG      = 'scadable-policy';
	const OPTION_GROUP   = 'scadable_policy';
	const OPT_TOKEN      = 'scadable_policy_token';
	const OPT_DOC_TYPE   = 'scadable_policy_default_doc_type';
	const REFRESH_ACTION = 'scadable_policy_refresh';

	/** Wire up the admin hooks. */
	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'add_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_post_' . self::REFRESH_ACTION, array( __CLASS__, 'handle_refresh' ) );
	}

	/** The saved token, or an empty string. */
	public static function get_token() {
		return trim( (string) get_option( self::OPT_TOKEN, '' ) );
	}

	/** The saved default doc type, normalised. */
	public static function get_default_doc_type() {
		return Scadable_Policy_API::normalize_doc_type( get_option( self::OPT_DOC_TYPE, 'privacy_policy' ) );
	}

	/** Add the options page under the Settings menu. */
	public static function add_page() {
		add_options_page(
			__( 'SCADABLE Privacy & Terms', 'scadable-policy' ),
			__( 'SCADABLE', 'scadable-policy' ),
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' )
		);
	}

	/** Register the settings, section and fields with the Settings API. */
	public static function register_settings() {
		register_setting(
			self::OPTION_GROUP,
			self::OPT_TOKEN,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_token' ),
				'default'           => '',
			)
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPT_DOC_TYPE,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( 'Scadable_Policy_API', 'normalize_doc_type' ),
				'default'           => 'privacy_policy',
			)
		);

		add_settings_section(
			'scadable_policy_main',
			'',
			array( __CLASS__, 'render_intro' ),
			self::PAGE_SLUG
		);

		add_settings_field(
			self::OPT_TOKEN,
			__( 'SCADABLE token', 'scadable-policy' ),
			array( __CLASS__, 'render_token_field' ),
			self::PAGE_SLUG,
			'scadable_policy_main',
			array( 'label_for' => self::OPT_TOKEN )
		);

		add_settings_field(
			self::OPT_DOC_TYPE,
			__( 'Default document', 'scadable-policy' ),
			array( __CLASS__, 'render_doc_type_field' ),
			self::PAGE_SLUG,
			'scadable_policy_main',
			array( 'label_for' => self::OPT_DOC_TYPE )
		);
	}

	/**
	 * Token sanitiser. SCADABLE tokens are short alphanumeric IDs, so we
	 * strip anything that is not a safe identifier character.
	 *
	 * @param mixed $value Raw submitted value.
	 * @return string
	 */
	public static function sanitize_token( $value ) {
		$value = is_string( $value ) ? trim( $value ) : '';
		return preg_replace( '/[^A-Za-z0-9_-]/', '', $value );
	}

	/** Section intro copy. */
	public static function render_intro() {
		echo '<p>' . esc_html__(
			'Enter your SCADABLE token below, then add the "SCADABLE Policy" block or the [scadable_policy] shortcode to any page. Your policy renders live from scadable.com and stays current automatically whenever you publish a new version.',
			'scadable-policy'
		) . '</p>';
	}

	/** The single required field: the token. */
	public static function render_token_field() {
		printf(
			'<input type="text" name="%1$s" id="%1$s" value="%2$s" class="regular-text" autocomplete="off" spellcheck="false" placeholder="%3$s" />',
			esc_attr( self::OPT_TOKEN ),
			esc_attr( self::get_token() ),
			esc_attr__( 'e.g. XltJvQpczMk0bDsG', 'scadable-policy' )
		);
		echo '<p class="description">' . esc_html__(
			'The public token from your SCADABLE project. This is the only required setting.',
			'scadable-policy'
		) . '</p>';
	}

	/** Optional default doc type. */
	public static function render_doc_type_field() {
		$current = self::get_default_doc_type();
		echo '<select name="' . esc_attr( self::OPT_DOC_TYPE ) . '" id="' . esc_attr( self::OPT_DOC_TYPE ) . '">';
		foreach ( Scadable_Policy_API::doc_types() as $value => $label ) {
			printf(
				'<option value="%1$s"%2$s>%3$s</option>',
				esc_attr( $value ),
				selected( $current, $value, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
		echo '<p class="description">' . esc_html__(
			'Used when a block or shortcode does not name a document type.',
			'scadable-policy'
		) . '</p>';
	}

	/** Render the options page. */
	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$token = self::get_token();

		if ( isset( $_GET['scadable_refreshed'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			echo '<div class="notice notice-success is-dismissible"><p>'
				. esc_html__( 'Cached policy cleared. The latest version is fetched on the next page view.', 'scadable-policy' )
				. '</p></div>';
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html__( 'SCADABLE Privacy & Terms', 'scadable-policy' ); ?></h1>

			<form action="options.php" method="post">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>

			<?php if ( '' !== $token ) : ?>
				<hr />
				<h2><?php echo esc_html__( 'How to display it', 'scadable-policy' ); ?></h2>
				<p><?php echo esc_html__( 'Add the "SCADABLE Policy" block to a page, or paste this shortcode:', 'scadable-policy' ); ?></p>
				<p><code>[scadable_policy]</code></p>
				<p><?php echo esc_html__( 'To show your terms of use instead, use:', 'scadable-policy' ); ?></p>
				<p><code>[scadable_policy doc_type="terms_of_use"]</code></p>

				<h2><?php echo esc_html__( 'Refresh', 'scadable-policy' ); ?></h2>
				<p class="description"><?php echo esc_html__( 'Policies are cached for up to one hour. Use this to fetch the latest version right now.', 'scadable-policy' ); ?></p>
				<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
					<input type="hidden" name="action" value="<?php echo esc_attr( self::REFRESH_ACTION ); ?>" />
					<?php
					wp_nonce_field( self::REFRESH_ACTION );
					submit_button( __( 'Refresh now', 'scadable-policy' ), 'secondary', 'submit', false );
					?>
				</form>
			<?php endif; ?>
		</div>
		<?php
	}

	/** Handle the "Refresh now" action: clear the cached policy. */
	public static function handle_refresh() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to do this.', 'scadable-policy' ) );
		}
		check_admin_referer( self::REFRESH_ACTION );

		$token = self::get_token();
		if ( '' !== $token ) {
			Scadable_Policy_API::clear_cache_for_token( $token );
		}

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'               => self::PAGE_SLUG,
					'scadable_refreshed' => '1',
				),
				admin_url( 'options-general.php' )
			)
		);
		exit;
	}
}
