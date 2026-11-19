import { GoogleGenAI, Type } from '@google/genai';
import { ApiError } from './errors';
import { getGeminiApiKey, getGeminiModel } from './gemini-env';
import { observeFaceBuffer, type FaceObservation } from '@/modules/skin/vision';

/**
 * AI provider seam (§14). The model is a COPYWRITER, never an authority:
 * it returns structured observations / copy that the service layer validates
 * (Zod) and grounds against the PostgreSQL catalogue before use.
 * No tools, no commerce writes, no direct DB access from here.
 */

export interface AnalysisObservation {
  skinType: string;
  concerns: string[];
  hydration: number;
  oiliness: number;
  sensitivity: number;
  texture: number;
  summary: string;
  limitations?: string;
  facePresent?: boolean;
  suitableForAnalysis?: boolean;
}

export interface AnalyzeInput {
  skinTypeHint: string;
  concernHints: string[];
  imageBytes?: Buffer;
  imageMime?: string;
}

export interface ChatContextProduct {
  slug: string;
  name: string;
  priceNgn: number;
  subCategory: string;
}

export interface AiProvider {
  readonly name: 'mock' | 'gemini';
  analyze(input: AnalyzeInput): Promise<unknown>;
  chat(input: { history: { role: string; content: string }[]; catalog: ChatContextProduct[] }): Promise<string>;
}

/** Deterministic stand-in: stable outputs for test environments without any API key. */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock' as const;

  async analyze(input: AnalyzeInput): Promise<unknown> {
    const concerns = input.concernHints.length > 0 ? [...new Set(input.concernHints)].slice(0, 6) : ['dryness', 'dullness'];
    const dry = concerns.some((c) => /dry|dehydrat|ashen/i.test(c));
    return {
      facePresent: true,
      suitableForAnalysis: true,
      skinType: input.skinTypeHint || 'combination',
      concerns,
      hydration: 0,
      oiliness: 0,
      sensitivity: 0,
      texture: 0,
      summary: `Mock analysis (no AI key configured): barrier looks ${dry ? 'thirsty — prioritize lipid-rich moisturisers' : 'balanced — maintain with gentle cleansing and daily SPF'}. Connect GEMINI_API_KEY for live analysis.`,
      limitations: 'Test fixture output without live photo processing.',
    };
  }

  async chat(input: { history: { role: string; content: string }[]; catalog: ChatContextProduct[] }): Promise<string> {
    const last = input.history.filter((m) => m.role === 'user').pop()?.content ?? '';
    const picks = input.catalog.slice(0, 3).map((p) => `${p.name} (₦${p.priceNgn.toLocaleString('en-NG')})`).join('; ');
    return picks
      ? `Mock concierge (no AI key): for "${last.slice(0, 80)}" I'd start with ${picks}. Connect GEMINI_API_KEY for live guidance.`
      : `Mock concierge (no AI key): tell me your skin type and top concern and I'll match catalogue products.`;
  }
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private readonly ai: GoogleGenAI;

  constructor(
    apiKey: string,
    private model = getGeminiModel(false),
  ) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Cosmetic photo assessment using the official `@google/genai` SDK.
   * Requires actual uploaded photo bytes — never fabricates numeric skin scores.
   */
  async analyze(input: AnalyzeInput): Promise<AnalysisObservation> {
    if (!input.imageBytes || !input.imageMime) {
      throw new ApiError(400, 'image_required', 'A verified face photo is required for Gemini cosmetic assessment.');
    }
    const obs: FaceObservation = await observeFaceBuffer(input.imageBytes, input.imageMime, undefined, 5 * 1024 * 1024);
    if (!obs.facePresent || !obs.suitableForAnalysis) {
      throw new ApiError(400, 'photo_unsuitable', obs.limitations || 'Please upload a clearer face photo in even lighting.');
    }
    const normalizedSkinType = obs.skinType === 'unknown' ? (input.skinTypeHint || 'normal') : obs.skinType;
    return {
      facePresent: obs.facePresent,
      suitableForAnalysis: obs.suitableForAnalysis,
      skinType: normalizedSkinType,
      concerns: obs.observations.length > 0 ? obs.observations.slice(0, 6) : input.concernHints.slice(0, 6),
      // Cosmetic tool only — do not invent measured numeric biometric scores.
      hydration: 0,
      oiliness: 0,
      sensitivity: 0,
      texture: 0,
      summary: `${obs.summary} ${obs.limitations}`.trim().slice(0, 980),
      limitations: obs.limitations,
    };
  }

  async chat(input: { history: { role: string; content: string }[]; catalog: ChatContextProduct[] }): Promise<string> {
    const catalogue = input.catalog.map((p) => `- ${p.name} (${p.subCategory}) ₦${p.priceNgn.toLocaleString('en-NG')} [${p.slug}]`).join('\n');
    let text = '';
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are Desla Beauty's concierge. Rules: recommend ONLY products from this catalogue list (by exact name); never invent products, certifications, order status, tracking updates, delivery times, balances or payment confirmations; direct personal order questions to the signed-in Orders page; never make medical claims; keep replies under 400 words.\nCATALOGUE:\n${catalogue}\nCONVERSATION:\n${input.history.slice(-10).map((m) => `${m.role}: ${m.content.slice(0, 500)}`).join('\n')}\nReply as JSON {"reply": string}.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
          responseSchema: {
            type: Type.OBJECT,
            properties: { reply: { type: Type.STRING } },
            required: ['reply'],
          },
          abortSignal: AbortSignal.timeout(15000),
        },
      });
      text = response.text ?? '';
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const status = typeof (err as { status?: unknown })?.status === 'number' ? (err as { status: number }).status : 0;
      if (status >= 400 && status < 600) {
        throw new ApiError(503, 'assistant_provider_failed', 'The beauty assistant could not respond. Please try again shortly.', true);
      }
      throw new ApiError(503, 'assistant_unavailable', 'The beauty assistant did not respond. Please try again.', true);
    }

    if (!text.trim()) {
      throw new ApiError(502, 'assistant_invalid_response', 'The beauty assistant returned an incomplete reply. Please try again.', true);
    }
    try {
      const parsed = JSON.parse(text) as { reply?: unknown } | null;
      if (typeof parsed?.reply !== 'string' || !parsed.reply.trim()) throw new Error();
      return parsed.reply.trim().slice(0, 2000);
    } catch {
      throw new ApiError(502, 'assistant_invalid_response', 'The beauty assistant returned an incomplete reply. Please try again.', true);
    }
  }
}

/** Only tests may use a deterministic fixture; live requests require configuration. */
export function getAiProvider(): AiProvider {
  const key = getGeminiApiKey();
  if (key) return new GeminiProvider(key);
  if (process.env.NODE_ENV === 'test') return new MockAiProvider();
  throw new ApiError(503, 'assistant_unavailable', 'The assistant is temporarily unavailable. You can still explore the catalogue.', true);
}
