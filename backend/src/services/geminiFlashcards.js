const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PDFParse } = require('pdf-parse');

const MAX_INPUT_CHARS = 30_000;
const MIN_PDF_TEXT_CHARS = 40;
const DEFAULT_MAX_CARDS = 20;
const ABS_MAX_CARDS = 40;

function truncateNotes(text) {
  const t = String(text).trim();
  if (t.length <= MAX_INPUT_CHARS) return t;
  return t.slice(0, MAX_INPUT_CHARS);
}

function stripJsonFence(s) {
  const t = String(s).trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m ? m[1].trim() : t;
}

function normalizeCards(parsed, maxCards) {
  const cap = Math.min(Math.max(1, maxCards), ABS_MAX_CARDS);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.cards)) return [];
  const out = [];
  for (const c of parsed.cards) {
    if (!c || typeof c.front !== 'string' || typeof c.back !== 'string') continue;
    const front = c.front.trim();
    const back = c.back.trim();
    if (!front || !back) continue;
    out.push({
      front,
      back,
      sourceSnippet:
        typeof c.sourceSnippet === 'string' ? c.sourceSnippet.trim().slice(0, 500) : undefined,
    });
    if (out.length >= cap) break;
  }
  return out;
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = (result.text || '').replace(/\s+/g, ' ').trim();
    return text;
  } finally {
    await parser.destroy?.().catch(() => {});
  }
}

/**
 * @param {string} material
 * @param {{ maxCards?: number }} options
 * @returns {Promise<{ front: string, back: string, sourceSnippet?: string }[]>}
 */
async function generateFlashcardsFromText(material, options = {}) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }

  let maxCards = DEFAULT_MAX_CARDS;
  if (options && options.maxCards != null) {
    const n = Number(options.maxCards);
    if (Number.isFinite(n) && n > 0) maxCards = Math.min(n, ABS_MAX_CARDS);
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
    .trim()
    .replace(/^["']|["']$/g, '');
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `You are a study assistant. Create flashcards from the material below.

Rules:
- Return ONLY valid JSON (no markdown code fences, no commentary).
- Shape must be exactly: {"cards":[{"front":"string","back":"string","sourceSnippet":null or "short quote"}]}
- Create between 1 and ${maxCards} cards.
- "front" = question or term; "back" = clear answer or definition.
- Optional sourceSnippet: a short excerpt from the material (under 200 chars) if helpful.

Material:
${material}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  let parsed;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch {
    const err = new Error('Model returned invalid JSON');
    err.code = 'BAD_JSON';
    throw err;
  }

  const cards = normalizeCards(parsed, maxCards);
  if (cards.length === 0) {
    const err = new Error('No valid cards in model output');
    err.code = 'EMPTY_CARDS';
    throw err;
  }
  return cards;
}

module.exports = {
  MAX_INPUT_CHARS,
  MIN_PDF_TEXT_CHARS,
  truncateNotes,
  extractPdfText,
  generateFlashcardsFromText,
};
