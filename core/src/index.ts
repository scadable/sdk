export { fetchPolicy, DEFAULT_BASE_URL } from './client';
export { fetchDocument, documentUrl, documentSlug, DEFAULT_DOCUMENT_BASE_URL } from './document';
export { isAllowedHtml } from './allowlist';
export type {
  Policy,
  FetchPolicyOptions,
  DocumentRef,
  FetchDocumentOptions,
  PublishedDocument,
  DocumentSource,
  DocumentOwner,
} from './types';
