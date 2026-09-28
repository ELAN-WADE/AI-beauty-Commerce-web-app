/**
 * AI provider seam (§14). The model is a COPYWRITER, never an authority:
 * it returns unstructured text / structured observations that the service
 * layer validates (Zod) and grounds against the database before use.
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
}

export interface ChatContextProduct {
  slug: string;
  name: string;
  priceNgn: number;
  subCategory: string;
}

export interface AiProvider {
  readonly name: 'mock' | 'gemini';
  analyze(input: { skinTypeHint: string; concernHints: string[] }): Promise<unknown>;
  chat(input: { history: { role: string; content: string }[]; catalog: ChatContextProduct[] }): Promise<string>;
}

/** Deterministic stand-in: stable outputs for dev/tests without any API key. */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock' as const;

  async analyze(input: { skinTypeHint: string; concernHints: string[] }): Promise<unknown> {
    const concerns = input.concernHints.length > 0 ? [...new Set(input.concernHints)].slice(0, 6) : ['dryness', 'dullness'];
    const dry = concerns.some((c) => /dry|dehydrat|ashen/i.test(c));
    return {
      skinType: input.skinTypeHint || 'combination',
      concerns,
      hydration: dry ? 32 : 58,
      oiliness: /oil|acne/i.test(concerns.join(' ')) ? 72 : 44,
      sensitivity: /sensitiv|redness/i.test(concerns.join(' ')) ? 68 : 30,
      texture: 55,
      summary: `Mock analysis (no AI key configured): barrier looks ${dry ? 'thirsty — prioritize lipid-rich moisturisers' : 'balanced — maintain with gentle cleansing and daily SPF'}. Connect GEMINI_API_KEY for live analysis.`,
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
  constructor(
    private apiKey: string,
    private model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  ) {}

  private async generate(contents: unknown, timeoutMs = 25000): Promise<string> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1024 } }),
          signal: ctrl.signal,
        },
      );
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (!text) throw new Error('Gemini returned no text');
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  async analyze(input: { skinTypeHint: string; concernHints: string[] }): Promise<unknown> {
    const text = await this.generate([
      {
        role: 'user',
        parts: [
          {
            text: `You are a cosmetic (non-medical) skin observation assistant. Customer profile: skin type "${input.skinTypeHint || 'unknown'}", concerns: ${input.concernHints.join(', ') || 'none stated'}. Return ONLY JSON: {"skinType": one of oily|dry|combination|sensitive|normal, "concerns": string[<=6], "hydration": 0-100, "oiliness": 0-100, "sensitivity": 0-100, "texture": 0-100, "summary": string <=300 chars, no medical claims, no product names}.`,
          },
        ],
      },
    ]);
    return JSON.parse(text) as unknown;
  }

  async chat(input: { history: { role: string; content: string }[]; catalog: ChatContextProduct[] }): Promise<string> {
    const catalogue = input.catalog.map((p) => `- ${p.name} (${p.subCategory}) ₦${p.priceNgn.toLocaleString('en-NG')} [${p.slug}]`).join('\n');
    const text = await this.generate([
      {
        role: 'user',
        parts: [
          {
            text: `You are Glowly's beauty concierge. Rules: recommend ONLY products from this catalogue list (by exact name); never invent products; never make medical claims; keep replies under 400 words.\nCATALOGUE:\n${catalogue}\nCONVERSATION:\n${input.history.slice(-10).map((m) => `${m.role}: ${m.content.slice(0, 500)}`).join('\n')}\nReply as JSON {"reply": string}.`,
          },
        ],
      },
    ]);
    const parsed = JSON.parse(text) as { reply?: unknown };
    if (typeof parsed.reply !== 'string' || parsed.reply.length === 0) throw new Error('Gemini returned no reply');
    return parsed.reply.slice(0, 2000);
  }
}

/** Mock unless GEMINI_API_KEY is set.Responses are labelled so clients stay honest. */
export function getAiProvider(): AiProvider {
  const key = process.env.GEMINI_API_KEY;
  if (key) return new GeminiProvider(key);
  return new MockAiProvider();
}
