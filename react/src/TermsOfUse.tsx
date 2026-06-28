'use client';

import * as React from 'react';

import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

export type TermsOfUseProps = Omit<ScadablePolicyProps, 'docType'>;

/**
 * Renders your always-current terms of use. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "terms_of_use".
 *
 * ```tsx
 * import { TermsOfUse } from '@scadable/react';
 *
 * export default function TermsPage() {
 *   return <TermsOfUse token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function TermsOfUse(props: TermsOfUseProps) {
  return <ScadablePolicy {...props} docType="terms_of_use" />;
}
