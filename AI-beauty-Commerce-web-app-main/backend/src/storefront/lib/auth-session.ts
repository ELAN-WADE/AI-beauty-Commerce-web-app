// A response from before sign-in/step-up must not undo a newer identity proof.
let revision = 0;
export const authSessionRevision = () => revision;
const identityWrites = new Set(['/api/auth/login', '/api/auth/admin/login', '/api/auth/logout', '/api/auth/verify-email', '/api/auth/reset-password', '/api/auth/oauth/exchange', '/api/auth/mfa/verify', '/api/auth/mfa/confirm', '/api/auth/mfa/disable']);
export function noteAuthResponse(path: string, method: string, success: boolean) {
  if (success && method.toUpperCase() === 'POST' && identityWrites.has(path.split('?')[0])) revision++;
}
export function shouldExpireAuthSession(path: string, status: number, code: string | undefined, startedAt: number) {
  const endpoint = path.split('?')[0];
  if (status !== 401 || startedAt !== revision || ['/api/auth/login', '/api/auth/admin/login'].includes(endpoint)) return false;
  if (code === 'mfa_invalid' || code === 'password_confirmation_failed') return false;
  revision++;
  return true;
}
