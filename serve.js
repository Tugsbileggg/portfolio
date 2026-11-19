// Local dev server: `npm run dev` → http://localhost:5173
// Static files plus /api/chat (reads GEMINI_API_KEY from .env if present).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 5173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/api/chat') {
      return import('./api/chat.js').then((m) => m.default(req, res)).catch((e) => { console.error(e); res.writeHead(500).end(); });
    }
    let file = path.normalize(path.join(root, url));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const type = types[path.extname(file).toLowerCase()] || 'application/octet-stream';
    // video needs byte ranges (Safari refuses to play without them)
    const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (range && fs.existsSync(file)) {
      const size = fs.statSync(file).size;
      const start = range[1] ? +range[1] : Math.max(0, size - +range[2]);
      const end = range[1] && range[2] ? Math.min(+range[2], size - 1) : size - 1;
      if (start >= size || start > end) return res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-cache' });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end('Not found');
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`Portfolio → http://localhost:${port}`));
