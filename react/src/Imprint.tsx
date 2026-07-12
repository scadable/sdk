'use client';

import * as React from 'react';

import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

export type ImprintProps = Omit<ScadablePolicyProps, 'docType'>;

/**
 * Renders your always-current imprint. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "imprint".
 *
 * ```tsx
 * import { Imprint } from '@scadable/react';
 *
 * export default function TermsPage() {
 *   return <Imprint token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function Imprint(props: ImprintProps) {
  return <ScadablePolicy {...props} docType="imprint" />;
}
