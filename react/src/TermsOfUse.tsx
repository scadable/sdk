'use client';

import * as React from 'react';

import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

export type TermsOfUseProps = NamedDocumentProps;

/**
 * Renders your always-current terms of use. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "terms_of_use". Pass a `token`,
 * or the `tenant` the document is published under.
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
  return <ScadablePolicy {...forDocType(props, 'terms_of_use')} />;
}
