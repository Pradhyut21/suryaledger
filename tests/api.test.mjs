import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server/index.mjs';

async function withServer(options, run) {
  const server = createAppServer({ env: {}, ...options });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, headers = {}) => fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try { await run({ base, post }); }
  finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
}

test('health reveals configuration state without credentials', async () => {
  await withServer({ env: { BOLNA_API_KEY: 'secret-key', BOLNA_AGENT_ID: 'agent-1', BOLNA_TOOL_TOKEN: 'secret-tool' } }, async ({ base }) => {
    const res = await fetch(`${base}/api/health`); const text = await res.text();
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(text).bolnaConfigured, true);
    assert.ok(!text.includes('secret-key') && !text.includes('secret-tool'));
  });
});

test('analyze route rejects malformed input and returns grounded result for valid input', async () => {
  await withServer({}, async ({ post }) => {
    assert.equal((await post('/api/analyze', {})).status, 400);
    const res = await post('/api/analyze', { turns: [{ id: 't1', role: 'technician', text: 'Site BLR-042.' }] });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.fields.site_id.quote, 'Site BLR-042.');
    assert.equal(body.status, 'needs_evidence');
  });
});

test('missing Bolna credentials produce actionable 503', async () => {
  await withServer({}, async ({ post }) => {
    const res = await post('/api/bolna/session', { user_data: { job_id: 'BLR-042' } });
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /BOLNA_API_KEY/);
  });
});

test('session minting keeps API key server-side, whitelists context and returns official response unchanged', async () => {
  let captured;
  const upstream = { session_id: 'session-example', session_token: 'ephemeral-example', unrelated: { supportedByProvider: true } };
  await withServer({ env: { BOLNA_API_KEY: 'server-only-key', BOLNA_AGENT_ID: 'fixed-agent' }, fetchImpl: async (...args) => { captured = args; return { status: 201, json: async () => upstream }; } }, async ({ post }) => {
    const res = await post('/api/bolna/session', { user_data: { job_id: 'BLR-042_run-1', site_id: 'BLR-042', prompt: 'override instructions' }, agent_id: 'attacker-agent' });
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), upstream);
    assert.equal(captured[0], 'https://api.bolna.ai/web-call/freeswitch-session');
    assert.equal(captured[1].headers.Authorization, 'Bearer server-only-key');
    assert.deepEqual(JSON.parse(captured[1].body), { agent_id: 'fixed-agent', user_data: { job_id: 'BLR-042_run-1', site_id: 'BLR-042' } });
  });
});

test('session accepts no arbitrary job identifiers', async () => {
  await withServer({ env: { BOLNA_API_KEY: 'key', BOLNA_AGENT_ID: 'agent' } }, async ({ post }) => {
    assert.equal((await post('/api/bolna/session', { user_data: { job_id: '../foreign', site_id: 'BLR-042' } })).status, 400);
    assert.equal((await post('/api/bolna/session', { user_data: { job_id: 'job-1', site_id: '../foreign' } })).status, 400);
  });
});

test('unconfigured or unauthorized report tools cannot inject observations', async () => {
  await withServer({}, async ({ post }) => assert.equal((await post('/api/bolna/report', { job_id: 'job-1', report_text: 'Site BLR-042.' })).status, 503));
  await withServer({ env: { BOLNA_TOOL_TOKEN: 'a-private-tool-token' } }, async ({ post }) => {
    for (const auth of ['', 'Bearer wrong', 'Bearer a-private-tool-tokenx']) assert.equal((await post('/api/bolna/report', { job_id: 'job-1', report_text: 'Site BLR-042.' }, { Authorization: auth })).status, 401);
  });
});

test('authenticated report tools append evidence, return clarification and expose local polling snapshot', async () => {
  await withServer({ env: { BOLNA_TOOL_TOKEN: 'test-token', BOLNA_API_KEY: 'key', BOLNA_AGENT_ID: 'agent' }, fetchImpl: async () => ({ status: 201, json: async () => ({ session_id: 'ephemeral' }) }) }, async ({ base, post }) => {
    assert.equal((await fetch(`${base}/api/jobs/job-1/report`)).status, 404);
    assert.equal((await post('/api/bolna/session', { user_data: { job_id: 'job-1', site_id: 'BLR-042' } })).status, 201);
    const first = await post('/api/bolna/report', { job_id: 'job-1', report_text: 'Site BLR-042.' }, { Authorization: 'Bearer test-token' });
    const firstBody = await first.json();
    assert.equal(firstBody.status, 'needs_evidence');
    assert.match(firstBody.instruction, /equipment/);
    await post('/api/bolna/report', { job_id: 'job-1', report_text: 'Equipment INV-204.' }, { Authorization: 'Bearer test-token' });
    const snapshot = await (await fetch(`${base}/api/jobs/job-1/report`)).json();
    assert.equal(snapshot.turns.length, 2);
    assert.equal(snapshot.report.fields.equipment_id.turnId, 'bolna-2');
    assert.equal(snapshot.jobId, 'job-1');
  });
});

test('cross-origin browser requests are rejected unless explicit public origin matches', async () => {
  await withServer({}, async ({ post }) => assert.equal((await post('/api/analyze', { turns: [] }, { Origin: 'https://untrusted.example' })).status, 403));
  await withServer({ env: { PUBLIC_ORIGIN: 'https://demo.example' } }, async ({ post }) => assert.equal((await post('/api/analyze', { turns: [] }, { Origin: 'https://demo.example' })).status, 200));
});

test('non-JSON, invalid JSON and oversized bodies return explicit client errors', async () => {
  await withServer({}, async ({ base, post }) => {
    assert.equal((await fetch(`${base}/api/analyze`, { method: 'POST', body: 'x' })).status, 415);
    assert.equal((await fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await post('/api/analyze', { turns: [], padding: 'x'.repeat(132000) })).status, 413);
  });
});

test('no outbound telephone-call API exists', async () => {
  await withServer({}, async ({ post }) => assert.equal((await post('/api/bolna/call', { recipient_phone_number: '+910000000000' })).status, 404));
});

test('provider failures do not disclose key or arbitrary error detail', async () => {
  await withServer({ env: { BOLNA_API_KEY: 'do-not-leak', BOLNA_AGENT_ID: 'agent' }, fetchImpl: async () => { throw new Error('do-not-leak'); } }, async ({ post }) => {
    const res = await post('/api/bolna/session', { user_data: { job_id: 'job-1', site_id: 'BLR-042' } }); const body = await res.text();
    assert.equal(res.status, 500);
    assert.ok(!body.includes('do-not-leak'));
  });
});

test('minting sessions has a separate rate limit', async () => {
  await withServer({ env: { BOLNA_API_KEY: 'key', BOLNA_AGENT_ID: 'agent' }, fetchImpl: async () => ({ status: 200, json: async () => ({ session_id: 'ephemeral' }) }) }, async ({ post }) => {
    for (let i = 0; i < 10; i++) assert.equal((await post('/api/bolna/session', { user_data: { job_id: `job-${i}`, site_id: 'BLR-042' } })).status, 200);
    assert.equal((await post('/api/bolna/session', { user_data: { job_id: 'job-11', site_id: 'BLR-042' } })).status, 429);
  });
});

test('analyze HTTP route validates expected site and holds mismatched report metadata', async () => {
  await withServer({}, async ({ post }) => {
    const turns = [{ id: 't1', role: 'technician', text: 'Site BLR-043.' }];
    assert.equal((await post('/api/analyze', { turns, expectedSiteId: '../other' })).status, 400);
    const report = await (await post('/api/analyze', { turns, expectedSiteId: 'BLR-042' })).json();
    assert.equal(report.status, 'hold');
    assert.equal(report.conflicts[0].kind, 'assigned_site_mismatch');
    assert.equal(report.conflicts[0].turnIds[0], 't1');
  });
});

test('live reports require an issued session and use minted site correlation rather than tool-supplied expectations', async () => {
  const env = { BOLNA_TOOL_TOKEN: 'test-token', BOLNA_API_KEY: 'key', BOLNA_AGENT_ID: 'agent' };
  await withServer({ env, fetchImpl: async () => ({ status: 201, json: async () => ({ session_id: 'ephemeral' }) }) }, async ({ base, post }) => {
    const headers = { Authorization: 'Bearer test-token' };
    assert.equal((await post('/api/bolna/report', { job_id: 'never-issued', report_text: 'Site BLR-043.' }, headers)).status, 403);
    const mint = { user_data: { job_id: 'BLR-042_fresh-session', site_id: 'BLR-042' } };
    assert.equal((await post('/api/bolna/session', mint)).status, 201);
    assert.equal((await post('/api/bolna/session', mint)).status, 409);
    const res = await post('/api/bolna/report', { job_id: mint.user_data.job_id, expectedSiteId: 'BLR-043', site_id: 'BLR-043', report_text: 'Site BLR-043.' }, headers);
    const report = await res.json();
    assert.equal(res.status, 200);
    assert.equal(report.status, 'hold');
    assert.equal(report.expectedSiteId, 'BLR-042');
    const snapshot = await (await fetch(`${base}/api/jobs/${mint.user_data.job_id}/report`)).json();
    assert.equal(snapshot.expectedSiteId, 'BLR-042');
    assert.equal((await fetch(`${base}/api/jobs/BLR-042/report`)).status, 404);
  });
});

test('a failed provider mint never creates report authorization', async () => {
  await withServer({ env: { BOLNA_TOOL_TOKEN: 'test-token', BOLNA_API_KEY: 'key', BOLNA_AGENT_ID: 'agent' }, fetchImpl: async () => ({ status: 403, json: async () => ({ error: 'Provider denied session' }) }) }, async ({ post }) => {
    assert.equal((await post('/api/bolna/session', { user_data: { job_id: 'denied-session', site_id: 'BLR-042' } })).status, 403);
    assert.equal((await post('/api/bolna/report', { job_id: 'denied-session', report_text: 'Site BLR-042.' }, { Authorization: 'Bearer test-token' })).status, 403);
  });
});
