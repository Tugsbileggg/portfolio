// POST /api/chat — Vercel serverless function (also served locally by serve.js).
// Streams a plain-text reply from Gemini (free tier), grounded only in js/config.js.
import { GoogleGenAI, ApiError } from '@google/genai';
import { site, projects } from '../js/config.js';

// Free-tier models are sometimes out of quota (429), overloaded (503) or just slow, so each one
// steps in for the one before it. If all are busy, wait a moment and try the round once more.
// Answers come from a short profile, so Flash-Lite with minimal thinking is fast and good enough,
// and it has the most generous free quota.
const MODELS = [
  { id: 'gemini-3.5-flash-lite', thinking: { thinkingLevel: 'MINIMAL' } },
  { id: 'gemini-3.8-flash', thinking: { thinkingLevel: 'LOW' } },
  { id: 'gemini-2.5-flash', thinking: { thinkingBudget: 0 } },
];
const ATTEMPTS = MODELS.length * 2;
const FIRST_TOKEN_MS = 7000; // give up on a model that hasn't started answering by then
const MAX_TURNS = 16;
const MAX_CHARS = 1500;

// the visitor picks English or Mongolian on the site; replies and errors follow that choice
const pick = (v, lang) => (v && typeof v === 'object' && 'en' in v ? v[lang] ?? v.en : v);
const systems = { en: buildSystem('en'), mn: buildSystem('mn') };
const say = {
  en: {
    noKey: "I'm not connected yet — the site owner still needs to add an API key.",
    offTopic: "Hmm, I can't help with that one. Ask me about Tugsbileg's work instead!",
    lost: '\n\n(connection lost)',
    quota: "I've talked a lot today and need to catch my breath — please try again later.",
    busy: 'The mountain air is thin right now — please try again in a moment.',
  },
  mn: {
    noKey: 'Би одоохондоо холбогдоогүй байна — сайтын эзэн API түлхүүр нэмэх хэрэгтэй.',
    offTopic: 'Хм, үүнд тусалж чадахгүй нь. Харин Төгсбилэгийн бүтээлүүдийн талаар асуугаарай!',
    lost: '\n\n(холболт тасарлаа)',
    quota: 'Өнөөдөр их ярьчихлаа, жаахан амсхийе — дараа дахин оролдоорой.',
    busy: 'Уулын агаар одоо жаахан сийрэг байна — хэсэг хүлээгээд дахин оролдоорой.',
  },
};
let ai;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, 'Method not allowed');

  let body, messages;
  try {
    body = await readJson(req);
    messages = clean(body.messages);
  } catch (e) {
    return send(res, 400, 'Bad request');
  }
  if (!messages) return send(res, 400, 'Bad request');
  const lang = body.lang === 'mn' ? 'mn' : 'en';
  if (!process.env.GEMINI_API_KEY) return send(res, 503, say[lang].noKey);

  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  let started = false;
  for (let i = 0; i < ATTEMPTS; i++) {
    const model = MODELS[i % MODELS.length];
    if (i === MODELS.length) await new Promise((r) => setTimeout(r, 1500));
    const t0 = Date.now();
    const slow = new AbortController();
    const timer = setTimeout(() => slow.abort(), FIRST_TOKEN_MS);
    try {
      const stream = await ai.models.generateContentStream({
        model: model.id,
        contents,
        // today's date lets it work out an age from the birthday in the profile
        config: { systemInstruction: `${systems[lang]}\n\nToday is ${new Date().toISOString().slice(0, 10)}.`, maxOutputTokens: 2048, thinkingConfig: model.thinking, abortSignal: slow.signal },
      });
      for await (const chunk of stream) {
        const t = chunk.text;
        if (!t) continue;
        if (!started) {
          started = true;
          clearTimeout(timer);
          console.log('[chat]', model.id, `first token ${Date.now() - t0}ms`);
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
        }
        res.write(t);
      }
      if (!started) return send(res, 200, say[lang].offTopic);
      return res.end();
    } catch (err) {
      const quota = err instanceof ApiError && err.status === 429;
      const busy = quota || (err instanceof ApiError && err.status >= 500) || (slow.signal.aborted && !started);
      console.error('[chat]', model.id, busy ? `busy (${err.status ?? 'slow'}) after ${Date.now() - t0}ms` : err);
      // any error moves on to the next model; only "busy" errors earn the second round
      if (!started && i < ATTEMPTS - 1 && (busy || i < MODELS.length - 1)) continue;
      if (started) return res.end(say[lang].lost);
      return send(res, quota ? 429 : 502, quota ? say[lang].quota : say[lang].busy);
    } finally {
      clearTimeout(timer);
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

// The profile is written in the visitor's chosen language, so answers reuse the site's own wording.
function buildSystem(lang) {
  const a = site.assistant;
  const tr = (v) => pick(v, lang);
  const cap = (n) => n[0] + n.slice(1).toLowerCase();
  const first = cap(pick(site.name, 'en'));
  const nameMn = cap(pick(site.name, 'mn'));
  const work = projects
    .map((p, i) => [
      `${i + 1}. ${tr(p.title)} (${p.year}) — ${tr(p.tagline)}`,
      `   ${tr(p.description)}`,
      `   Role: ${tr(p.role)}`,
      `   Stack: ${p.stack.join(', ')}`,
      p.url && p.url !== '#' ? `   Live: ${p.url}` : '',
      p.repo ? `   Code: ${p.repo}` : '',
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  const language = lang === 'mn'
    ? `The visitor chose Mongolian for this site. Reply in Mongolian Cyrillic, also when they type Mongolian in Latin letters (for example "sain uu"), unless their latest message is clearly in another language such as English; then use that language. Spell the name ${nameMn}.`
    : `The visitor is browsing the site in English. Reply in English, unless their latest message is in another language; then use that language (Mongolian always in Cyrillic, where the name is spelled ${nameMn}).`;

  return `You are ${tr(a.name)}, a small, friendly snow-capped mountain who lives in the corner of ${first}'s portfolio website and chats with visitors about ${first}.

Answer only from the profile below. If a visitor asks something the profile doesn't cover (salary, private details, anything not listed), say you don't know and suggest contacting ${first} directly — never guess or invent details. If they ask for something unrelated to ${first} (general coding help, homework, other topics), politely steer back to ${first} and the work.

${language}

Answer the actual question with real details from the profile. For example, when asked what ${first} has built, name the projects with a few words on each instead of inviting further questions. Keep replies short and conversational: usually one to three sentences, or a short dash list when naming several things. Plain text, no headings, tables or bold. You may share the links and email from the profile. Refer to ${first} by name rather than with gendered pronouns. A light touch of mountain charm is welcome, but stay helpful first.

<profile>
Name: ${first} (Mongolian: ${nameMn})
Role: ${tr(site.role)}
Based in: ${tr(site.location)}
Open to work: ${site.available ? 'yes' : 'not right now'}
Email: ${site.email}
${site.socials.map((s) => `${s.label}: ${s.url}`).join('\n')}

About: ${tr(site.about.text)}

${a.facts.map((f) => `- ${f}`).join('\n')}

Projects:
${work}
</profile>`;
}
