import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

/** Props for <TermsOfUse>: a `token` or a `tenant`, with the document fixed to "terms_of_use". */
export type TermsOfUseProps = NamedDocumentProps;

/**
 * Renders your always-current terms of use. A thin wrapper over {@link ScadablePolicy}
 * with `docType` fixed to "terms_of_use"; see that component for the hybrid SEO + live
 * behavior.
 *
 * ```tsx
 * import { TermsOfUse } from '@scadable/next';
 *
 * export default function TermsPage() {
 *   return <TermsOfUse token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function TermsOfUse(props: TermsOfUseProps) {
  return ScadablePolicy(forDocType(props, 'terms_of_use'));
}
