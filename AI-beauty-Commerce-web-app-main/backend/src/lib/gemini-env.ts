const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];
const RETIRED_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]);

/**
 * Resolves the configured Google Gemini API key from environment variables.
 * Supports both `GEMINI_API_KEY` (canonical) and `GEMINI_AI_API` (local alias),
 * stripping any accidental surrounding quotes or whitespace.
 */
export function getGeminiApiKey(): string | undefined {
  const raw = process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_AI_API?.trim();
  if (!raw) return undefined;
  const cleaned = raw.replace(/^['"]|['"]$/g, '').trim();
  return cleaned || undefined;
}

/**
 * Resolves the active Gemini model, upgrading retired 1.5/2.0/2.5 defaults to
 * an active Flash model so newer Google AI Studio keys work without 404 errors.
 */
export function getGeminiModel(vision = false): string {
  const configured = (
    (vision ? process.env.GEMINI_VISION_MODEL : undefined) ||
    process.env.GEMINI_MODEL ||
    ''
  ).trim();
  if (!configured || RETIRED_GEMINI_MODELS.has(configured)) {
    return DEFAULT_GEMINI_MODEL;
  }
  return configured;
}

/**
 * Ordered unique list of Gemini models to try when a primary model encounters
 * transient 503 unavailability or deprecation.
 */
export function getGeminiModelCandidates(vision = false): string[] {
  const primary = getGeminiModel(vision);
  return Array.from(new Set([primary, ...FALLBACK_GEMINI_MODELS]));
}
