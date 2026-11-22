import { config } from '../config/env';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 20000;

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>;
}

export interface GenerateOptions {
  systemInstruction?: string;
  contents: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export function isAiEnabled(): boolean {
  return config.ai.enabled && !!config.ai.geminiApiKey;
}

/**
 * Universal Gemini caller:
 * - Uses GEMINI_MODEL env var (defaults to gemini-2.5-flash)
 * - Sends API key in x-goog-api-key header (never in URL)
 * - Enforces a 20-second timeout via AbortController
 * - Retries once on HTTP 429 or 503 (1500ms delay)
 * - On 429 rate limit, returns a user-friendly message string
 * - Reads all candidate parts, not just parts[0]
 * - Logs failures with console.warn
 * - Respects AI_ENABLED flag
 */
async function doFetch(endpoint: string, payload: any, apiKey: string, signal: AbortSignal): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
    signal,
  });
}

const RATE_LIMIT_MESSAGE =
  'I am getting too many questions right now. Please wait a minute and try again — your botanical garden is worth the wait.';

export async function callGemini(options: GenerateOptions): Promise<string | null> {
  if (!isAiEnabled()) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload: any = {
      contents: options.contents,
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
      },
    };

    if (options.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    let response = await doFetch(endpoint, payload, config.ai.geminiApiKey, controller.signal);

    // Retry once on 429 or 503
    if (response.status === 429 || response.status === 503) {
      const retryStatus = response.status;
      await new Promise((r) => setTimeout(r, 1500));
      response = await doFetch(endpoint, payload, config.ai.geminiApiKey, controller.signal);
      if (!response.ok) {
        if (retryStatus === 429) {
          console.warn(`[GEMINI SERVICE] Rate limit (429) persisted after retry`);
          return RATE_LIMIT_MESSAGE;
        }
        const errText = await response.text();
        console.warn(`[GEMINI SERVICE] API request failed after retry (${response.status}):`, errText);
        return null;
      }
    } else if (!response.ok) {
      const errText = await response.text();
      console.warn(`[GEMINI SERVICE] API request failed (${response.status}):`, errText);
      return null;
    }

    const json: any = await response.json();
    // Read ALL parts, not just parts[0]
    const parts: Array<{ text?: string }> = json?.candidates?.[0]?.content?.parts || [];
    const candidateText = parts.map((p) => p.text || '').join('').trim() || null;
    return candidateText;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn(`[GEMINI SERVICE] Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      console.warn('[GEMINI SERVICE] Failed to execute Gemini request:', err.message || err);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── In-memory 6-hour cache for user personalized suggestions ────────────────
interface CachedSuggestion {
  tip: string;
  timestamp: number;
}
const suggestionsCache = new Map<number, CachedSuggestion>();
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function getCachedAiSuggestion(userId: number, plantListSummary: string): Promise<string | null> {
  if (!isAiEnabled()) return null;

  const now = Date.now();
  const cached = suggestionsCache.get(userId);
  if (cached && now - cached.timestamp < SIX_HOURS_MS) {
    return cached.tip;
  }

  const systemInstruction = 'You are an expert houseplant horticulturist for LeafPulse. Provide concise, high-value botanical guidance. Strictly no emojis.';
  const userPrompt = `In exactly two sentences, provide a tailored seasonal care insight for an indoor plant collection containing: ${plantListSummary}. Address practical moisture or light dynamics.`;

  const responseText = await callGemini({
    systemInstruction,
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    temperature: 0.3,
    maxOutputTokens: 250,
  });

  if (responseText) {
    const cleanTip = responseText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    suggestionsCache.set(userId, {
      tip: cleanTip,
      timestamp: now,
    });
    return cleanTip;
  }

  return null;
}
