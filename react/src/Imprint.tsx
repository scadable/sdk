'use client';

import * as React from 'react';

import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

export type ImprintProps = NamedDocumentProps;

/**
 * Renders your always-current imprint. A thin wrapper around
 * {@link ScadablePolicy} with `docType` pinned to "imprint". Pass a `token`,
 * or the `tenant` the document is published under.
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
  return <ScadablePolicy {...forDocType(props, 'imprint')} />;
}
