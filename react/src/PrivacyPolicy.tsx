'use client';

import * as React from 'react';

import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

export type PrivacyPolicyProps = Omit<ScadablePolicyProps, 'docType'>;

/**
 * Renders your always-current privacy policy. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "privacy_policy".
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
  return <ScadablePolicy {...props} docType="privacy_policy" />;
}
