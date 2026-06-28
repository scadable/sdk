/**
 * Editor script for the "SCADABLE Policy" block.
 *
 * Deliberately plain ES5 against the global wp.* packages, so the plugin
 * ships with no build step. The block is dynamic: save() returns null and
 * the real markup comes from the PHP render_callback, which keeps the
 * rendered policy server-side and SEO clean. In the editor we preview it
 * with <ServerSideRender />.
 */
( function ( wp ) {
	'use strict';

	var el                 = wp.element.createElement;
	var Fragment           = wp.element.Fragment;
	var registerBlockType  = wp.blocks.registerBlockType;
	var InspectorControls  = wp.blockEditor.InspectorControls;
	var PanelBody          = wp.components.PanelBody;
	var TextControl        = wp.components.TextControl;
	var SelectControl      = wp.components.SelectControl;
	var ServerSideRender   = wp.serverSideRender;
	var __                 = wp.i18n.__;

	registerBlockType( 'scadable/policy', {
		edit: function ( props ) {
			var attributes   = props.attributes;
			var setAttributes = props.setAttributes;

			var controls = el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{ title: __( 'SCADABLE Policy', 'scadable-policy' ), initialOpen: true },
					el( TextControl, {
						label: __( 'Token', 'scadable-policy' ),
						help: __( 'Leave blank to use the token saved in Settings -> SCADABLE.', 'scadable-policy' ),
						value: attributes.token,
						autoComplete: 'off',
						onChange: function ( value ) {
							setAttributes( { token: value } );
						}
					} ),
					el( SelectControl, {
						label: __( 'Document type', 'scadable-policy' ),
						value: attributes.docType,
						options: [
							{ label: __( 'Privacy policy', 'scadable-policy' ), value: 'privacy_policy' },
							{ label: __( 'Terms of use', 'scadable-policy' ), value: 'terms_of_use' }
						],
						onChange: function ( value ) {
							setAttributes( { docType: value } );
						}
					} )
				)
			);

			var preview = el( ServerSideRender, {
				block: 'scadable/policy',
				attributes: attributes
			} );

			return el( Fragment, {}, controls, preview );
		},

		// Dynamic block: the server renders it (see render_callback in PHP).
		save: function () {
			return null;
		}
	} );
} )( window.wp );
