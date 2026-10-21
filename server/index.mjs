import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { analyzeReport, InputError, validateExpectedSiteId } from './engine.mjs';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(resolve(PROJECT_ROOT, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const JOB_ID = /^[A-Za-z0-9_-]{1,80}$/;
const LIVE_SESSION_TTL_MS = 60 * 60 * 1000;

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

async function bodyJson(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw Object.assign(new Error('Send application/json.'), { statusCode: 415 });
  let bytes = 0; const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes <= 128 * 1024) chunks.push(chunk);
  }
  if (bytes > 128 * 1024) throw Object.assign(new Error('Request exceeds 128 KiB.'), { statusCode: 413 });
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new InputError('Request must contain a JSON object.'); }
}

function sameToken(received, expected) {
  if (typeof received !== 'string' || !expected) return false;
  const actual = Buffer.from(received); const wanted = Buffer.from(`Bearer ${expected}`);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function allowedBrowserRequest(req, env) {
  if (!req.headers.origin) return true;
  try {
    const origin = new URL(req.headers.origin);
    return ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || origin.origin === env.PUBLIC_ORIGIN;
  } catch { return false; }
}

/** Zero-dependency local demo server. Bind to loopback unless explicitly changed. */
export function createAppServer({ env = process.env, fetchImpl = fetch, staticDir = resolve(PROJECT_ROOT, 'dist'), clock = () => Date.now() } = {}) {
  const jobs = new Map();
  const sessions = new Map();
  const requests = new Map();
  function rateLimited(req, route, limit = 60) {
    const now = clock(); const key = `${req.socket.remoteAddress}:${route}`;
    const current = requests.get(key);
    if (!current || now - current.start > 60000) { requests.set(key, { start: now, count: 1 }); return false; }
    current.count += 1;
    return current.count > limit;
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      if (!allowedBrowserRequest(req, env)) return json(res, 403, { error: 'Browser origin is not allowed.' });
      if (path.startsWith('/api/') && rateLimited(req, path, path === '/api/bolna/session' ? 10 : 120)) return json(res, 429, { error: 'Too many requests. Try again in a minute.' });

      if (req.method === 'GET' && path === '/api/health') return json(res, 200, {
        ok: true, service: 'SuryaLedger', mode: 'local-demo',
        bolnaConfigured: Boolean(env.BOLNA_API_KEY && env.BOLNA_AGENT_ID),
        toolConfigured: Boolean(env.BOLNA_TOOL_TOKEN),
      });
      if (req.method === 'POST' && path === '/api/analyze') {
        const body = await bodyJson(req);
        return json(res, 200, analyzeReport(body.turns, { expectedSiteId: body.expectedSiteId }));
      }
      if (req.method === 'POST' && path === '/api/bolna/session') {
        const body = await bodyJson(req);
        if (!env.BOLNA_API_KEY || !env.BOLNA_AGENT_ID) return json(res, 503, { error: 'Add BOLNA_API_KEY and BOLNA_AGENT_ID to the server .env file, then restart the server.' });
        const jobId = body.user_data?.job_id;
        if (typeof jobId !== 'string' || !JOB_ID.test(jobId)) throw new InputError('user_data.job_id must be a unique live-session routing key.');
        const expectedSiteId = validateExpectedSiteId(body.user_data?.site_id);
        if (sessions.has(jobId)) return json(res, 409, { error: 'This live-session routing key has already been issued. Start with a fresh key.' });
        const upstream = await fetchImpl('https://api.bolna.ai/web-call/freeswitch-session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.BOLNA_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: env.BOLNA_AGENT_ID, user_data: { job_id: jobId, site_id: expectedSiteId } }),
          signal: AbortSignal.timeout(15000),
        });
        // The SDK owns the session schema. Pass the provider response through.
        const response = await upstream.json();
        if (upstream.status >= 200 && upstream.status < 300) {
          if (sessions.size >= 100) { const oldest = sessions.keys().next().value; sessions.delete(oldest); jobs.delete(oldest); }
          sessions.set(jobId, { expectedSiteId, issuedAt: clock() });
        }
        return json(res, upstream.status, response);
      }
      if (req.method === 'POST' && path === '/api/bolna/report') {
        if (!env.BOLNA_TOOL_TOKEN) return json(res, 503, { error: 'Bolna report tool is not configured.' });
        if (!sameToken(req.headers.authorization, env.BOLNA_TOOL_TOKEN)) return json(res, 401, { error: 'Invalid tool authorization.' });
        const body = await bodyJson(req);
        if (typeof body.job_id !== 'string' || !JOB_ID.test(body.job_id)) throw new InputError('job_id must contain 1–80 letters, numbers, underscores, or hyphens.');
        const session = sessions.get(body.job_id);
        if (!session) return json(res, 403, { error: 'No issued live session matches this routing key. Start a new browser call.' });
        if (clock() - session.issuedAt > LIVE_SESSION_TTL_MS) { sessions.delete(body.job_id); jobs.delete(body.job_id); return json(res, 410, { error: 'This local live-session record expired. Start a new browser call.' }); }
        if (typeof body.report_text !== 'string' || !body.report_text.trim() || body.report_text.length > 8000) throw new InputError('report_text must contain 1–8,000 characters.');
        const previous = jobs.get(body.job_id);
        const turns = [...(previous?.turns || []), { id: `bolna-${(previous?.turns.length || 0) + 1}`, role: 'technician', text: body.report_text.trim(), at: new Date(clock()).toISOString() }];
        const report = analyzeReport(turns, { expectedSiteId: session.expectedSiteId });
        const snapshot = { jobId: body.job_id, expectedSiteId: session.expectedSiteId, turns, report, updatedAt: new Date(clock()).toISOString() };
        // Local demo storage is intentionally ephemeral and bounded.
        if (!jobs.has(body.job_id) && jobs.size >= 100) jobs.delete(jobs.keys().next().value);
        jobs.set(body.job_id, snapshot);
        return json(res, 200, { ...report, jobId: body.job_id, instruction: report.readyForReview ? 'Read back the captured facts. Never say certified, safe, or closed. A supervisor must review.' : `Ask the technician: ${report.nextQuestion}` });
      }
      const jobMatch = path.match(/^\/api\/jobs\/([A-Za-z0-9_-]{1,80})\/report$/);
      if (req.method === 'GET' && jobMatch) {
        const snapshot = jobs.get(jobMatch[1]);
        return json(res, snapshot ? 200 : 404, snapshot || { error: 'No report received for this job yet.' });
      }
      if (path.startsWith('/api/')) return json(res, 404, { error: 'Unknown API route.' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
      let decoded;
      try { decoded = decodeURIComponent(path); } catch { throw new InputError('Malformed path.'); }
      const root = resolve(staticDir);
      const target = resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
      if (target !== root && !target.startsWith(`${root}${sep}`)) return json(res, 403, { error: 'Path is outside the static directory.' });
      try {
        const content = await readFile(target);
        res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : content);
      } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') return json(res, 404, { error: 'Page not found. Run npm run build before npm start, or use npm run dev.' });
        throw error;
      }
    } catch (error) {
      const timeout = error.name === 'TimeoutError' || error.name === 'AbortError';
      json(res, error.statusCode || (timeout ? 504 : 500), { error: error.statusCode ? error.message : timeout ? 'Bolna session request timed out. Try again.' : 'Request failed. Check the server configuration.' });
    }
  });
  server.requestTimeout = 15000;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || '127.0.0.1';
  createAppServer().listen(port, host, () => console.log(`SuryaLedger server: http://${host}:${port}`));
}
