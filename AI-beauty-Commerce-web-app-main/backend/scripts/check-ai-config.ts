import '../src/lib/load-env';
import { getAiProvider } from '../src/lib/ai-provider';
import { FACE_CONSENT, observeFace } from '../src/modules/skin/vision';
import sharp from 'sharp';

// Never print credentials, provider response bodies, or customer images.
async function main() {
  const configured = Boolean(process.env.GEMINI_API_KEY?.trim());
  console.log(`Gemini key configured: ${configured}`);
  console.log(`Chat model: ${process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'}`);
  console.log(`Vision model: ${process.env.GEMINI_VISION_MODEL?.trim() || 'gemini-2.5-flash'}`);
  if (!configured) {
    console.error('Set GEMINI_API_KEY in backend/.env.local or the backend hosting environment, then restart the backend. A frontend environment variable does not configure the backend.');
    process.exitCode = 1;
    return;
  }
  if (!process.argv.includes('--live')) {
    console.log('Configuration only. Run npm run ai:check -- --live to test chat and vision with Google (uses API quota).');
    return;
  }
  let failed = false;
  try {
    const reply = await getAiProvider().chat({ history: [{ role: 'user', content: 'Briefly explain what you can help with. No product recommendations.' }], catalog: [] });
    if (!reply.trim()) throw new Error();
    console.log('Chat: valid live reply received.');
  } catch {
    failed = true;
    console.error('Chat failed. Check key permissions, billing/quota, network access and GEMINI_MODEL availability.');
  }
  try {
    // A plain generated swatch tests image transport without using personal data.
    const image = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#aaaaaa' } }).png().toBuffer();
    const result = await observeFace({ consentAccepted: true, consentVersion: FACE_CONSENT, image: 'data:image/png;base64,' + image.toString('base64') });
    if (result.facePresent || result.suitableForAnalysis) throw new Error();
    console.log('Vision: valid live response; correctly rejected a non-face image.');
  } catch {
    failed = true;
    console.error('Vision failed. Check key permissions, billing/quota, network access and GEMINI_VISION_MODEL image support.');
  }
  if (failed) process.exitCode = 1;
  else console.log('Provider checks passed. Still verify a consented face scan and in-stock recommendations through the running storefront and database.');
}
void main().catch(() => { console.error('AI configuration check failed.'); process.exitCode = 1; });
