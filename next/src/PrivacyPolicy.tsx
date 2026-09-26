import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

/** Props for <PrivacyPolicy>: a `token` or a `tenant`, with the document fixed to "privacy_policy". */
export type PrivacyPolicyProps = NamedDocumentProps;

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
  return ScadablePolicy(forDocType(props, 'privacy_policy'));
}
