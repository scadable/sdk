import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

/** Props for <PrivacyPolicy>: the generic props minus `docType` (fixed to "privacy_policy"). */
export type PrivacyPolicyProps = Omit<ScadablePolicyProps, 'docType'>;

/**
 * Renders your always-current privacy policy. A thin wrapper over {@link ScadablePolicy}
 * with `docType` fixed to "privacy_policy"; see that component for the hybrid SEO + live
 * behavior.
 *
 * ```tsx
 * import { PrivacyPolicy } from '@scadable/next';
 *
 * export default function PrivacyPage() {
 *   return <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function PrivacyPolicy(props: PrivacyPolicyProps) {
  return ScadablePolicy({ ...props, docType: 'privacy_policy' });
}
