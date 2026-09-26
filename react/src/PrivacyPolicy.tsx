'use client';

import * as React from 'react';

import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

export type PrivacyPolicyProps = NamedDocumentProps;

/**
 * Renders your always-current privacy policy. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "privacy_policy". Pass a `token`,
 * or the `tenant` the document is published under.
 *
 * ```tsx
 * import { PrivacyPolicy } from '@scadable/react';
 *
 * export default function PrivacyPage() {
 *   return <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function PrivacyPolicy(props: PrivacyPolicyProps) {
  return <ScadablePolicy {...forDocType(props, 'privacy_policy')} />;
}
