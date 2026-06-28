import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

/** Props for <TermsOfUse>: the generic props minus `docType` (fixed to "terms_of_use"). */
export type TermsOfUseProps = Omit<ScadablePolicyProps, 'docType'>;

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
  return ScadablePolicy({ ...props, docType: 'terms_of_use' });
}
