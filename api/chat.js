// POST /api/chat — Vercel serverless function (also served locally by serve.js).
// Streams a plain-text reply from Gemini (free tier), grounded only in js/config.js.
import { GoogleGenAI, ApiError } from '@google/genai';
import { site, projects } from '../js/config.js';

// Free-tier models are sometimes out of quota (429) or overloaded (503), so each one steps in for
// the one before it. If all are busy, wait a moment and try the round once more.
const MODELS = [
  { id: 'gemini-3.8-flash', thinking: { thinkingLevel: 'LOW' } },
  { id: 'gemini-3.5-flash-lite', thinking: { thinkingLevel: 'LOW' } },
  { id: 'gemini-2.5-flash', thinking: { thinkingBudget: 0 } },
];
const ATTEMPTS = MODELS.length * 2;
const MAX_TURNS = 16;
const MAX_CHARS = 1500;

const system = buildSystem();
let ai;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, 'Method not allowed');
  if (!process.env.GEMINI_API_KEY) {
    return send(res, 503, "I'm not connected yet — the site owner still needs to add an API key.");
  }

  let messages;
  try {
    messages = clean((await readJson(req)).messages);
  } catch (e) {
    return send(res, 400, 'Bad request');
  }
  if (!messages) return send(res, 400, 'Bad request');

  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  let started = false;
  for (let i = 0; i < ATTEMPTS; i++) {
    const model = MODELS[i % MODELS.length];
    if (i === MODELS.length) await new Promise((r) => setTimeout(r, 1500));
    try {
      const stream = await ai.models.generateContentStream({
        model: model.id,
        contents,
        config: { systemInstruction: system, maxOutputTokens: 2048, thinkingConfig: model.thinking },
      });
      for await (const chunk of stream) {
        const t = chunk.text;
        if (!t) continue;
        if (!started) {
          started = true;
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
        }
        res.write(t);
      }
      if (!started) return send(res, 200, "Hmm, I can't help with that one. Ask me about Tugsbileg's work instead!");
      return res.end();
    } catch (err) {
      const quota = err instanceof ApiError && err.status === 429;
      const busy = quota || (err instanceof ApiError && err.status >= 500);
      console.error('[chat]', model.id, busy ? `busy (${err.status})` : err);
      if (busy && !started && i < ATTEMPTS - 1) continue;
      if (started) return res.end('\n\n(connection lost)');
      return send(res, quota ? 429 : 502, quota
        ? "I've talked a lot today and need to catch my breath — please try again later."
        : 'The mountain air is thin right now — please try again in a moment.');
    }
  }
}

function send(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

async function readJson(req) {
  // Vercel pre-parses the body; plain node:http (serve.js) does not.
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 64_000) throw new Error('body too large');
  }
  return JSON.parse(raw);
}

// Keep only well-formed, alternating user/assistant turns, starting and ending with the visitor.
function clean(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const m of list.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (!content) continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += `\n${content}`;
    else out.push({ role: m.role, content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

function buildSystem() {
  const a = site.assistant;
  const first = site.name[0] + site.name.slice(1).toLowerCase();
  const work = projects
    .map((p, i) => [
      `${i + 1}. ${p.title} (${p.year}) — ${p.tagline}`,
      `   ${p.description}`,
      `   Role: ${p.role}`,
      `   Stack: ${p.stack.join(', ')}`,
      p.url && p.url !== '#' ? `   Live: ${p.url}` : '',
      p.repo ? `   Code: ${p.repo}` : '',
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  return `You are ${a.name}, a small, friendly snow-capped mountain who lives in the corner of ${first}'s portfolio website and chats with visitors about ${first}.

Answer only from the profile below. If a visitor asks something the profile doesn't cover (salary, age, past employers, anything personal), say you don't know and suggest contacting ${first} directly — never guess or invent details. If they ask for something unrelated to ${first} (general coding help, homework, other topics), politely steer back to ${first} and the work.

Reply in the visitor's language — Mongolian (Cyrillic) if they write Mongolian, English if English, and so on. Keep replies short and conversational: usually one to three sentences, plain text, no headings or tables. You may share the links and email from the profile. Refer to ${first} by name rather than with gendered pronouns. A light touch of mountain charm is welcome, but stay helpful first.

<profile>
Name: ${first}
Role: ${site.role}
Based in: ${site.location}
Open to work: ${site.available ? 'yes' : 'not right now'}
Email: ${site.email}
${site.socials.map((s) => `${s.label}: ${s.url}`).join('\n')}

About: ${site.about.text}

${a.facts.map((f) => `- ${f}`).join('\n')}

Projects:
${work}
</profile>`;
}
