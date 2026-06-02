// ==========================================================================
// server.js — local dev server for Glass Garden Rooms
// Serves the static site + a /api/lead endpoint that proxies to GoHighLevel.
// Run:  node server.js   (or:  npm start)
// ==========================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

// Load .env.local (and .env as fallback) without requiring dotenv as a dep.
(function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(__dirname, file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    text.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) return;
      const k = m[1];
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      if (!(k in process.env)) process.env[k] = v;
    });
  }
})();

const leadHandler = require('./api/lead.js');

const PORT = +process.env.PORT || 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.pdf':  'application/pdf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const full = path.normalize(path.join(root, decoded));
  if (!full.startsWith(root)) return null;
  return full;
}

async function readJsonBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let len = 0;
    const chunks = [];
    req.on('data', c => {
      len += c.length;
      if (len > limit) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8') || '{}';
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';

  // ---- API routes ----
  if (url.startsWith('/api/lead')) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json', Allow: 'POST' });
      return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
    try {
      req.body = await readJsonBody(req);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
    return leadHandler(req, res);
  }

  // ---- Static files ----
  let urlPath = url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  let filePath = safeJoin(ROOT, urlPath);
  if (!filePath) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Try .html extension for clean URLs like /products
      if (!path.extname(urlPath)) {
        const alt = safeJoin(ROOT, urlPath + '.html');
        if (alt && fs.existsSync(alt)) return stream(alt);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found: ' + urlPath);
    }
    stream(filePath);
  });

  function stream(p) {
    const ext = path.extname(p).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(p).pipe(res);
  }
});

server.listen(PORT, () => {
  const hasGhl = !!process.env.GHL_LOCATION_ID && !!process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
  console.log(`\n  Glass Garden Rooms — local server`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → GHL credentials: ${hasGhl ? 'loaded' : 'NOT SET (edit .env.local)'}\n`);
});
