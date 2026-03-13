#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const ROOT = __dirname;
const LOG_PATH = path.join(ROOT, 'coruna_logs_host.txt');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...NO_CACHE_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function appendLines(lines) {
  if (!Array.isArray(lines) || !lines.length) return;
  const clean = lines
    .filter((line) => typeof line === 'string')
    .map((line) => line.replace(/[\r\n]+$/g, ''));
  if (!clean.length) return;
  fs.appendFileSync(LOG_PATH, clean.join('\n') + '\n', 'utf8');
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function logStaticRequest(status, method, reqPath, filePath) {
  const line = `[HTTP] ${status} ${method} ${reqPath}${filePath ? ` -> ${filePath}` : ''}`;
  console.log(line);
  appendLines([line]);
}

function serveStatic(req, reqPath, res) {
  let filePath = path.join(ROOT, reqPath === '/' ? 'group.html' : reqPath);
  filePath = path.normalize(filePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    logStaticRequest(403, req.method || 'GET', reqPath, filePath);
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      logStaticRequest(404, req.method || 'GET', reqPath, filePath);
      return;
    }

    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        logStaticRequest(404, req.method || 'GET', reqPath, filePath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { ...NO_CACHE_HEADERS, 'Content-Type': type });
      res.end(data);
      logStaticRequest(200, req.method || 'GET', reqPath, filePath);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url || '/', true);
  const pathname = parsed.pathname || '/';

  const isLogEndpoint = pathname === '/log' || pathname === '/logs' || pathname === '/log_receiver.php' || pathname === '/log_receiver';

  if (isLogEndpoint) {
    if (req.method === 'GET') {
      let content = '';
      try {
        content = fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, 'utf8') : '';
      } catch {
        content = '';
      }
      res.writeHead(200, { ...NO_CACHE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(content);
      return;
    }

    if (req.method === 'DELETE') {
      try {
        fs.writeFileSync(LOG_PATH, '', 'utf8');
      } catch {}
      sendJson(res, 200, { success: true });
      return;
    }

    if (req.method === 'POST') {
      try {
        const raw = await collectBody(req);
        let lines = [];
        try {
          const payload = JSON.parse(raw || '{}');
          if (Array.isArray(payload.lines)) {
            lines = payload.lines;
          } else if (typeof payload.line === 'string') {
            lines = [payload.line];
          }
        } catch {
          if (raw && raw.trim()) lines = [raw.trim()];
        }
        appendLines(lines);
        sendJson(res, 200, { success: true, count: lines.length });
      } catch (error) {
        sendJson(res, 500, { success: false, error: String(error && error.message ? error.message : error) });
      }
      return;
    }

    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  serveStatic(req, pathname, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Host server running on http://0.0.0.0:${PORT}/`);
  console.log(`Logs file: ${LOG_PATH}`);
});
