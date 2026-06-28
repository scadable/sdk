// Fetch client + types come from @scadable/core (shared across every platform package).
export { fetchPolicy, DEFAULT_BASE_URL } from '@scadable/core';
export type { Policy, FetchPolicyOptions } from '@scadable/core';

// Generic server component (any docType) + the back-compat / convenience wrappers.
export { ScadablePolicy } from './ScadablePolicy';
export type { ScadablePolicyProps } from './ScadablePolicy';
export { PrivacyPolicy } from './PrivacyPolicy';
export type { PrivacyPolicyProps } from './PrivacyPolicy';
export { TermsOfUse } from './TermsOfUse';
export type { TermsOfUseProps } from './TermsOfUse';

// The shared 'use client' island (also exported for advanced/manual composition).
export { PolicyLive } from './PolicyLive';
export type { PolicyLiveProps } from './PolicyLive';
