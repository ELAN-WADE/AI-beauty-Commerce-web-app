import '../src/lib/load-env';
import { SmtpSender } from '../src/lib/email';

// Readiness only: no email, credential reset, or account mutation.
const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM'];
const missing = required.filter(key => !process.env[key]?.trim());
if (missing.length) {
  console.error(JSON.stringify({ smtp: 'not_configured', missing }));
  process.exitCode = 1;
} else {
  try {
    await new SmtpSender().verify();
    console.log(JSON.stringify({ smtp: 'connection_and_authentication_passed', messageSent: false }));
  } catch (error) {
    const code = (error as { code?: string }).code;
    console.error(JSON.stringify({ smtp: 'connection_failed', code: code && /^[A-Z_]+$/.test(code) ? code : 'SMTP_ERROR', message: 'Check the SMTP host, port, TLS mode and credentials in backend/.env.local.' }));
    process.exitCode = 1;
  }
}
