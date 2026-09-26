import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

/** Props for <Imprint>: a `token` or a `tenant`, with the document fixed to "imprint". */
export type ImprintProps = NamedDocumentProps;

/**
 * Renders your always-current imprint. A thin wrapper over {@link ScadablePolicy}
 * with `docType` fixed to "imprint"; see that component for the hybrid SEO + live
 * behavior.
 *
 * ```tsx
 * import { Imprint } from '@scadable/next';
 *
 * export default function TermsPage() {
 *   return <Imprint token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function Imprint(props: ImprintProps) {
  return ScadablePolicy(forDocType(props, 'imprint'));
}
