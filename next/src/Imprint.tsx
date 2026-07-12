import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

/** Props for <Imprint>: the generic props minus `docType` (fixed to "imprint"). */
export type ImprintProps = Omit<ScadablePolicyProps, 'docType'>;

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
  return ScadablePolicy({ ...props, docType: 'imprint' });
}
