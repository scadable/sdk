'use client';

import * as React from 'react';

import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

export type CookiePolicyProps = Omit<ScadablePolicyProps, 'docType'>;

/**
 * Renders your always-current cookie policy. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "cookie_policy".
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
  return <ScadablePolicy {...props} docType="cookie_policy" />;
}
