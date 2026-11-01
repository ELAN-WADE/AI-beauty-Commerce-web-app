/** The launcher sets this marker only for the actual web process. Build workers
 * and external-worker deployments must never start an email dispatcher. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DESLA_EMBEDDED_AUTH_EMAIL === '1') {
    const { startEmbeddedAccountEmail } = await import('./worker/embedded-account-email');
    startEmbeddedAccountEmail();
  }
}
