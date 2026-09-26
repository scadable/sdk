import { ScadablePolicy, forDocType } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

/** Props for <CookiePolicy>: a `token` or a `tenant`, with the document fixed to "cookie_policy". */
export type CookiePolicyProps = NamedDocumentProps;

/**
 * Renders your always-current cookie policy. A thin wrapper over {@link ScadablePolicy}
 * with `docType` fixed to "cookie_policy"; see that component for the hybrid SEO + live
 * behavior.
 *
 * ```tsx
 * import { CookiePolicy } from '@scadable/next';
 *
 * export default function TermsPage() {
 *   return <CookiePolicy token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export function CookiePolicy(props: CookiePolicyProps) {
  return ScadablePolicy(forDocType(props, 'cookie_policy'));
}
