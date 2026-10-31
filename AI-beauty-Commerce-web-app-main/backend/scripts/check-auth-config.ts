import '../src/lib/load-env';
import { getEmailSender } from '../src/lib/email';
import { googleConfigurationStatus } from '../src/modules/auth/redirects';

// Readiness only: no email, credential reset, or account mutation.
const google = googleConfigurationStatus();
console.log(JSON.stringify({ google, dispatcher: process.env.AUTH_EMAIL_WORKER_MODE || 'external' }));
if (!google.configured) process.exitCode = 1;
try {
  const sender = getEmailSender();
  if (sender.name === 'log') throw new Error('Configure a real email transport.');
  await sender.verify?.();
  console.log(JSON.stringify({ email: 'connection_and_authentication_passed', transport: sender.name, messageSent: false }));
} catch (error) {
  const code = (error as { code?: string }).code;
  console.error(JSON.stringify({ email: 'not_ready', code: code && /^[A-Z_]+$/.test(code) ? code : 'EMAIL_CONFIGURATION_ERROR', message: 'Check EMAIL_TRANSPORT, the verified sender and provider credentials in backend environment settings.' }));
  process.exitCode = 1;
}
