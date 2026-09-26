'use client';

import * as React from 'react';

import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

export type CookiePolicyProps = NamedDocumentProps;

/**
 * Renders your always-current cookie policy. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "cookie_policy". Pass a `token`,
 * or the `tenant` the document is published under.
 *
 * ```tsx
 * import { CookiePolicy } from '@scadable/react';
 *
 * export default function TermsPage() {
 *   return <CookiePolicy token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function CookiePolicy(props: CookiePolicyProps) {
  return <ScadablePolicy {...forDocType(props, 'cookie_policy')} />;
}
