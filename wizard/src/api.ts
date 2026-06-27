/**
 * Tiny client for the public SCADABLE wizard API.
 *
 * Every call carries the temporary install token in the `X-Wizard-Token`
 * header. Uses the global `fetch` (Node 18+), so there is no HTTP dependency.
 */

export const DEFAULT_API = 'https://api.scadable.com';

/** Returned by `GET /wizard/session`. */
export interface WizardSession {
  public_id: string;
  scope_name: string;
  domain: string;
}

/** One file change in a plan. */
export interface PlanEdit {
  path: string;
  action: 'create' | 'patch';
  contents: string;
}

/** Returned by `POST /wizard/plan`. */
export interface WizardPlan {
  install: string[];
  edits: PlanEdit[];
  deterministic: boolean;
  route_hint: string;
  public_id: string;
}

/** Body sent to `POST /wizard/plan`. */
export interface PlanRequest {
  framework: string;
  mode: 'create' | 'patch';
  deps: string[];
  paths: string[];
  target?: { path: string; contents: string };
}

/** An API call that returned a non-2xx status. Carries the HTTP status. */
export class WizardApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'WizardApiError';
    this.status = status;
  }
}

/** An API call that never reached the server (DNS, refused, offline, ...). */
export class WizardNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WizardNetworkError';
  }
}

function endpoint(api: string, path: string): string {
  return `${api.replace(/\/$/, '')}${path}`;
}

async function request<T>(
  api: string,
  path: string,
  token: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<T> {
  const url = endpoint(api, path);

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method,
      headers: {
        'X-Wizard-Token': token,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new WizardNetworkError(`could not reach ${url}: ${reason}`);
  }

  if (!res.ok) {
    throw new WizardApiError(await detail(res, path), res.status);
  }
  return (await res.json()) as T;
}

/** Pull a human-readable error out of a FastAPI `{ detail }` body when present. */
async function detail(res: Response, path: string): Promise<string> {
  let extra = '';
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data?.detail === 'string') extra = `: ${data.detail}`;
  } catch {
    // No JSON body; fall back to the status line.
  }
  return `${path} returned ${res.status}${extra}`;
}

/** Verify the install token and learn which scope it belongs to. */
export function getSession(api: string, token: string): Promise<WizardSession> {
  return request<WizardSession>(api, '/wizard/session', token);
}

/** Ask the server for an install plan tailored to this repo. */
export function postPlan(api: string, token: string, body: PlanRequest): Promise<WizardPlan> {
  return request<WizardPlan>(api, '/wizard/plan', token, { method: 'POST', body });
}

/** Mark the scope connected once the local changes are in place. */
export function postComplete(api: string, token: string): Promise<{ connected: boolean }> {
  return request<{ connected: boolean }>(api, '/wizard/complete', token, { method: 'POST' });
}
