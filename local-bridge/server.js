'use strict';

const crypto = require('crypto');
const express = require('express');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || '';
const ADA_API_URL = (process.env.ADA_API_URL || 'http://127.0.0.1:47821').replace(/\/+$/, '');
const ADA_API_TOKEN = process.env.ADA_API_TOKEN || '';
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 30);
const CHAT_TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS || 180000);
const FORWARD_TIMEOUT_MS = Number(process.env.FORWARD_TIMEOUT_MS || 30000);

const DEFAULT_TOOLS = [
  'tasks.list',
  'tasks.create',
  'memory.remember',
  'filesystem.read_text',
  'system.open_app',
  'system.open_url',
  'system.safe_command',
  'google.today',
  'google.search_email',
  'github.repo_status',
  'home_assistant.service',
  'telephony.call',
];

const TOOL_ALLOWLIST = new Set(
  (process.env.BRIDGE_TOOLS || DEFAULT_TOOLS.join(','))
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
);

if (!BRIDGE_SECRET) {
  console.error('[Ada Jarvis Bridge] BRIDGE_SECRET is required. Refusing to start without it.');
  process.exit(1);
}
if (BRIDGE_SECRET.length < 16) {
  console.error('[Ada Jarvis Bridge] BRIDGE_SECRET must be at least 16 characters.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

function log(message) {
  console.log(`[Ada Jarvis Bridge] ${new Date().toISOString()} ${message}`);
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

const buckets = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 60000 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_PER_MIN) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded.' });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60000).unref();

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !timingSafeEqual(token, BRIDGE_SECRET)) {
    log(`rejected unauthorized ${req.method} ${req.path} from ${req.ip}`);
    return res.status(401).json({ success: false, error: 'Unauthorized local bridge access.' });
  }
  next();
}

app.use(rateLimit);
app.use(authenticate);
app.use(express.json({ limit: '64kb' }));

async function adaFetch(path, { method = 'POST', body, timeoutMs = FORWARD_TIMEOUT_MS } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (ADA_API_TOKEN) headers.Authorization = `Bearer ${ADA_API_TOKEN}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${ADA_API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text.slice(0, 2000) };
    }
    if (!response.ok) {
      const error = new Error(`ADA responded ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function adaDown(res, error) {
  const unreachable = error.name === 'AbortError' || error.name === 'TypeError' || error.code === 'ECONNREFUSED';
  if (unreachable) {
    return res.status(503).json({
      success: false,
      error: 'Local ADA API is unreachable. Start ADA (ada cli/serve) on 127.0.0.1:47821.',
    });
  }
  return res.status(error.status || 502).json({ success: false, error: error.message, detail: error.payload });
}

app.get('/health', async (req, res) => {
  try {
    await adaFetch('/health', { method: 'GET', timeoutMs: 5000 });
    res.json({ success: true, ada: 'up', bridge: 'ok' });
  } catch (error) {
    res.status(503).json({ success: false, ada: 'down', error: 'Local ADA API unreachable.' });
  }
});

app.post('/chat', async (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'No prompt provided.' });
  }
  log(`chat from ${req.ip}: ${prompt.slice(0, 120)}`);
  try {
    const result = await adaFetch('/v1/chat', { body: { message: prompt.slice(0, 20000) }, timeoutMs: CHAT_TIMEOUT_MS });
    res.json({ success: true, result });
  } catch (error) {
    adaDown(res, error);
  }
});

app.post('/execute', async (req, res) => {
  const { tool, args, command } = req.body || {};
  const action = tool || (command ? 'system.safe_command' : null);
  const actionArgs = tool ? (args || {}) : { command };

  if (!action) {
    return res.status(400).json({ success: false, error: 'No tool or command provided.' });
  }
  if (!TOOL_ALLOWLIST.has(action)) {
    log(`blocked non-allow-listed tool "${action}" from ${req.ip}`);
    return res.status(403).json({ success: false, error: `Tool is not forwarded by the bridge: ${action}` });
  }
  if (action === 'system.safe_command' && typeof actionArgs.command !== 'string') {
    return res.status(400).json({ success: false, error: 'command must be a string.' });
  }

  log(`execute ${action} from ${req.ip}: ${JSON.stringify(actionArgs).slice(0, 160)}`);
  try {
    const result = await adaFetch('/v1/tools/execute', { body: { tool: action, args: actionArgs }, timeoutMs: CHAT_TIMEOUT_MS });
    res.json({ success: true, result });
  } catch (error) {
    adaDown(res, error);
  }
});

app.get('/approvals', async (req, res) => {
  const status = req.query.status === 'all' ? 'all' : 'pending';
  try {
    const result = await adaFetch(`/v1/approvals?status=${encodeURIComponent(status)}`, { method: 'GET' });
    res.json({ success: true, result });
  } catch (error) {
    adaDown(res, error);
  }
});

app.post('/approvals/:id', async (req, res) => {
  const { id } = req.params;
  const approved = Boolean(req.body && req.body.approved);
  log(`approval ${approved ? 'approve' : 'reject'} ${id} from ${req.ip}`);
  try {
    const result = await adaFetch(`/v1/approvals/${encodeURIComponent(id)}`, { body: { approved } });
    res.json({ success: true, result });
  } catch (error) {
    adaDown(res, error);
  }
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Unknown bridge route.' }));

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(400).json({ success: false, error: 'Invalid or oversized JSON body.' });
  }
  log(`unhandled error: ${error.message}`);
  res.status(500).json({ success: false, error: 'Internal bridge error.' });
});

app.listen(PORT, HOST, () => {
  log(`listening on http://${HOST}:${PORT} -> ADA ${ADA_API_URL}`);
  log(`tool allow-list: ${[...TOOL_ALLOWLIST].join(', ')}`);
});
