import { ScadablePolicy } from './ScadablePolicy';
import type { ScadablePolicyProps } from './ScadablePolicy';

/** Props for <CookiePolicy>: the generic props minus `docType` (fixed to "cookie_policy"). */
export type CookiePolicyProps = Omit<ScadablePolicyProps, 'docType'>;

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
  return ScadablePolicy({ ...props, docType: 'cookie_policy' });
}
