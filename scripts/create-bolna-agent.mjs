import { readFile, writeFile, mkdir, rename, open, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Never prints account credentials, private tool transports, or full API bodies.
// --prepare / --catalog perform read-only provider queries. Only --create POSTs;
// --sync-tool updates an existing agent with PUT after preserving current config.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const privateDir = resolve(root, '.bolna');
const envPath = resolve(root, '.env');
const statePath = resolve(privateDir, 'agent-create-status.private.json');
try { process.loadEnvFile(envPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const command = process.argv[2] || '--prepare';
const allowed = new Set(['--catalog', '--prepare', '--create', '--inspect-agent', '--prepare-sync-tool', '--sync-tool', '--verify-tool']);
if (!allowed.has(command) || process.argv.length > 3) { console.error('Use --catalog, --prepare, --create, --inspect-agent, --prepare-sync-tool, --sync-tool, or --verify-tool. No action taken.'); process.exit(1); }
const apiKey = process.env.BOLNA_API_KEY;
const toolToken = process.env.BOLNA_TOOL_TOKEN;
const API = 'https://api.bolna.ai';

function redact(message) {
  let text = String(message);
  for (const value of [apiKey, toolToken]) if (value) text = text.split(value).join('[redacted]');
  return text.slice(0, 500);
}
async function privateJson(path, body) { await writeFile(path, `${JSON.stringify(body, null, 2)}\n`, { mode: 0o600 }); }
async function readStatus() { try { return JSON.parse(await readFile(statePath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
async function getJson(path) {
  const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Bolna read-only catalog request returned HTTP ${response.status}. Check account access and credits in the dashboard.`);
  return response.json();
}
async function selectVoice() {
  const catalog = await getJson('/api/v1/voice-config/tts?language=en');
  const preference = [
    ['cartesia', ['sonic-3.5', 'sonic-3.6', 'sonic-3']],
    ['elevenlabs', ['eleven_flash_v2_5', 'eleven_turbo_v2_5']],
    ['deepgram', ['aura-2']],
    ['sarvam', ['bulbul:v3', 'bulbul:v4-flash']],
  ];
  const providers = Array.isArray(catalog.providers) ? catalog.providers : [];
  for (const [slug, models] of preference) {
    const provider = providers.find((entry) => entry.slug === slug && entry.is_supported !== false);
    if (!provider) continue;
    for (const modelName of models) {
      const model = provider.models?.find((entry) => entry.model_id === modelName && entry.is_supported !== false);
      if (!model) continue;
      const params = new URLSearchParams({ language: 'en', provider_id: provider.id, model_id: model.id, page: '1', page_size: '100' });
      const voices = await getJson(`/api/v1/voice-config/tts/voices?${params}`);
      // Use curated catalog voices, never account-created/custom voices.
      const voice = voices.items?.find((entry) => entry.source === 'platform' && entry.voice_id && entry.name && entry.use_case?.includes('conversational'))
        || voices.items?.find((entry) => entry.source === 'platform' && entry.voice_id && entry.name);
      if (voice) return { provider: slug, model: model.model_id, voice: voice.name, voice_id: voice.voice_id, language: 'en', catalogCheckedAt: new Date().toISOString() };
    }
  }
  throw new Error('No supported curated English voice/model pair was found. Inspect the account voice catalog; no agent was created.');
}
function publicOrigin() {
  let url;
  try { url = new URL(process.env.BOLNA_PUBLIC_BASE_URL); } catch { throw new Error('Set BOLNA_PUBLIC_BASE_URL to the protected public HTTPS callback origin before preparing or creating.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('BOLNA_PUBLIC_BASE_URL must be an HTTPS origin without path, credentials, query, or fragment.');
  return url.origin;
}
async function buildRequest(voice) {
  if (!toolToken || toolToken.length < 24) throw new Error('Set a distinct BOLNA_TOOL_TOKEN of at least 24 characters before preparing the agent.');
  const origin = publicOrigin();
  const tool = JSON.parse(await readFile(resolve(root, 'bolna/review-tool.example.json'), 'utf8'));
  const systemPrompt = await readFile(resolve(root, 'bolna/system-prompt.md'), 'utf8');
  const parameters = { ...tool.parameters, additionalProperties: false };
  const transport = { ...tool.value, url: `${origin}/api/bolna/report`, api_token: `Bearer ${toolToken}`, pre_call_message: tool.pre_call_message };
  const providerConfig = { voice: voice.voice, voice_id: voice.voice_id, model: voice.model };
  if (['cartesia', 'sarvam'].includes(voice.provider)) providerConfig.language = 'en';
  return {
    agent_config: {
      agent_name: 'SuryaLedger — synthetic solar service review',
      agent_welcome_message: 'Hi, I am SuryaLedger, an AI assistant collecting a synthetic solar service report for site {site_id}. May I collect this report for supervisor review?',
      tasks: [{
        task_type: 'conversation',
        toolchain: { execution: 'sequential', pipelines: [['transcriber', 'llm', 'synthesizer']] },
        tools_config: {
          llm_agent: { agent_type: 'simple_llm_agent', agent_flow_type: 'streaming', llm_config: { provider: 'openai', model: 'gpt-4.1-mini', max_tokens: 220, temperature: 0.2 } },
          synthesizer: { provider: voice.provider, provider_config: providerConfig, stream: true, buffer_size: 150, audio_format: 'wav' },
          transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en', stream: true, encoding: 'linear16', sampling_rate: 16000, endpointing: 400, keywords: 'SuryaLedger,inverter,kilowatt,BLR,INV' },
          input: { provider: 'freeswitch', format: 'linear16' },
          output: { provider: 'freeswitch', format: 'linear16' },
          api_tools: {
            tools: [{ name: tool.name, description: tool.description, parameters }],
            tools_params: { [tool.name]: transport },
          },
        },
        task_config: { call_terminate: 300, hangup_after_silence: 20, max_silence_repeats: 1 },
      }],
    },
    agent_prompts: { task_1: { system_prompt: systemPrompt } },
  };
}
async function persistAgentId(agentId) {
  const current = await readFile(envPath, 'utf8');
  const existing = current.match(/^BOLNA_AGENT_ID[ \t]*=[ \t]*([^\r\n]*)/m)?.[1]?.trim();
  if (existing && existing !== agentId) throw new Error('An agent ID was added to .env during creation. The new agent receipt is saved privately; reconcile IDs manually before proceeding.');
  const next = /^BOLNA_AGENT_ID[ \t]*=/m.test(current) ? current.replace(/^BOLNA_AGENT_ID[ \t]*=.*$/m, `BOLNA_AGENT_ID=${agentId}`) : `${current.trimEnd()}\nBOLNA_AGENT_ID=${agentId}\n`;
  const temporary = resolve(root, `.env.agent-${process.pid}.tmp`);
  await writeFile(temporary, next, { mode: 0o600 });
  await rename(temporary, envPath);
}

async function currentAgent() {
  const agentId = process.env.BOLNA_AGENT_ID?.trim();
  if (!agentId || !/^[0-9a-f-]{36}$/i.test(agentId)) throw new Error('A valid existing BOLNA_AGENT_ID is required. This action never creates an agent.');
  const data = await getJson(`/v2/agent/${agentId}`);
  await privateJson(resolve(privateDir, 'agent-current.private.json'), data);
  return { agentId, data };
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
  return value;
}
function fingerprint(value) { return createHash('sha256').update(JSON.stringify(sorted(value))).digest('hex'); }
const REQUEST_CONFIG_KEYS = ['agent_name', 'agent_welcome_message', 'webhook_url', 'agent_type', 'tasks', 'ingest_source_config', 'calling_guardrails', 'call_summary_enabled'];
function updateRequestFromAgent(data) {
  const config = data.agent_config || data;
  if (!Array.isArray(config.tasks) || !data.agent_prompts || !config.agent_name) throw new Error('Retrieved agent does not match the verified v2 config/prompt schema. No update sent.');
  return { agent_config: Object.fromEntries(REQUEST_CONFIG_KEYS.filter((key) => Object.hasOwn(config, key)).map((key) => [key, structuredClone(config[key])])), agent_prompts: structuredClone(data.agent_prompts) };
}
function reportTransport(request) {
  const matching = request.agent_config.tasks.filter((task) => task.tools_config?.api_tools?.tools_params?.review_service_report);
  if (matching.length !== 1) throw new Error('Expected exactly one existing review_service_report tool. No update sent.');
  return matching[0].tools_config.api_tools.tools_params.review_service_report;
}
function outsideTransportFingerprint(request) {
  const copy = structuredClone(request); const transport = reportTransport(copy);
  delete transport.url; delete transport.api_token;
  return fingerprint(copy);
}
async function verifyPreparedToolUpdate() {
  const prepared = JSON.parse(await readFile(resolve(privateDir, 'agent-tool-update.private.json'), 'utf8'));
  const { agentId, data } = await currentAgent();
  const readback = updateRequestFromAgent(data);
  const transport = reportTransport(readback);
  if (transport.url !== `${publicOrigin()}/api/bolna/report` || transport.api_token !== `Bearer ${toolToken}` || outsideTransportFingerprint(readback) !== outsideTransportFingerprint(prepared)) throw new Error('Read-only tool verification differs from the prepared request. Inspect private snapshots before proceeding.');
  await privateJson(resolve(privateDir, 'tool-sync-status.private.json'), { state: 'verified', verifiedAt: new Date().toISOString(), agent_id: agentId, outsideTransportUnchanged: true, recoveredByReadOnlyVerification: true });
  try { await unlink(resolve(privateDir, 'agent-tool-sync.lock')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  console.log('Read-only verification succeeded: existing agent report URL/token match local configuration; other prepared config/prompts are unchanged. No mutation or call sent.');
}
async function syncExistingTool(prepareOnly) {
  if (!toolToken || toolToken.length < 24) throw new Error('A distinct BOLNA_TOOL_TOKEN of at least 24 characters is required.');
  const { agentId, data } = await currentAgent();
  const original = updateRequestFromAgent(data);
  const request = structuredClone(original);
  const desiredUrl = `${publicOrigin()}/api/bolna/report`;
  const transport = reportTransport(request);
  if (transport.method !== 'POST') throw new Error('Existing report transport is not POST. No update sent.');
  const alreadyMatches = transport.url === desiredUrl && transport.api_token === `Bearer ${toolToken}`;
  transport.url = desiredUrl;
  transport.api_token = `Bearer ${toolToken}`;
  if (outsideTransportFingerprint(original) !== outsideTransportFingerprint(request)) throw new Error('Change guard failed: update would alter fields outside the report URL/token.');
  await privateJson(resolve(privateDir, 'agent-tool-update.private.json'), request);
  if (prepareOnly) { console.log('Prepared ignored .bolna/agent-tool-update.private.json from the current agent. Only the existing report URL/token differ; no update sent.'); return; }
  const receiptPath = resolve(privateDir, 'tool-sync-status.private.json');
  if (alreadyMatches) { await privateJson(receiptPath, { state: 'verified', checkedAt: new Date().toISOString(), agent_id: agentId, noUpdateNeeded: true }); console.log('Existing agent report URL/token already match the local configuration. No update or creation request sent.'); return; }
  let prior;
  try { prior = JSON.parse(await readFile(receiptPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (['pending', 'unknown'].includes(prior?.state)) throw new Error('An earlier tool update has an unknown outcome and readback differs. Reconcile the private receipt/dashboard before retrying.');
  const lockPath = resolve(privateDir, 'agent-tool-sync.lock');
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); } catch (error) { if (error.code === 'EEXIST') throw new Error('A tool-sync lock exists. Reconcile its private receipt; no update sent.'); throw error; }
  const startedAt = new Date().toISOString();
  let knownOutcome = false;
  await privateJson(receiptPath, { state: 'pending', startedAt, agent_id: agentId, requestHash: fingerprint(request) });
  try {
    // The official v2 contract is PUT, requiring full config + prompts, not PATCH.
    // Fetching/preserving the current request and readback guard limit this to
    // the existing tool transport URL/token; no new agent is created.
    const response = await fetch(`${API}/v2/agent/${agentId}`, { method: 'PUT', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(30000) });
    const result = await response.json().catch(() => null);
    if (response.status !== 200) {
      knownOutcome = response.status >= 400 && response.status < 500;
      await privateJson(receiptPath, { state: knownOutcome ? 'rejected' : 'unknown', startedAt, agent_id: agentId, httpStatus: response.status, message: redact(result?.message || result?.error || 'Unexpected update response') });
      throw new Error(`Existing-agent update returned HTTP ${response.status}; ${knownOutcome ? 'request rejected' : 'outcome unknown; do not retry automatically'}.`);
    }
    knownOutcome = true;
    await privateJson(receiptPath, { state: 'updated_unverified', startedAt, agent_id: agentId });
    const readback = updateRequestFromAgent((await currentAgent()).data);
    const checked = reportTransport(readback);
    if (checked.url !== desiredUrl || checked.api_token !== `Bearer ${toolToken}` || outsideTransportFingerprint(readback) !== outsideTransportFingerprint(original)) throw new Error('Provider accepted the update but readback verification differs. Inspect private snapshots before proceeding.');
    await privateJson(receiptPath, { state: 'verified', startedAt, verifiedAt: new Date().toISOString(), agent_id: agentId, outsideTransportUnchanged: true });
    console.log('Updated the existing report tool URL/token with the official PUT API and verified readback. Other config/prompts are unchanged. No agent created or call placed.');
  } catch (error) {
    let state;
    try { state = JSON.parse(await readFile(receiptPath, 'utf8')); } catch {}
    if (state?.state === 'pending') await privateJson(receiptPath, { state: 'unknown', startedAt, agent_id: agentId, message: 'Transport failed or timed out; reconcile readback before retrying.' });
    throw error;
  } finally { await lock.close(); if (knownOutcome) await unlink(lockPath); }
}

try {
  if (!apiKey) throw new Error('BOLNA_API_KEY is missing from the local server environment.');
  await mkdir(privateDir, { recursive: true });
  if (command === '--inspect-agent') {
    const { data } = await currentAgent();
    const config = data.agent_config || data;
    console.log(JSON.stringify({ keyPresent: Boolean(apiKey), agentIdPresent: Boolean(process.env.BOLNA_AGENT_ID), topLevelKeys: Object.keys(data), taskCount: config.tasks?.length || 0, taskKeys: Object.keys(config.tasks?.[0] || {}), toolNames: Object.keys(config.tasks?.[0]?.tools_config?.api_tools?.tools_params || {}), hasPrompts: Boolean(data.agent_prompts) }));
    process.exit(0);
  }
  if (command === '--prepare-sync-tool' || command === '--sync-tool') { await syncExistingTool(command === '--prepare-sync-tool'); process.exit(0); }
  if (command === '--verify-tool') { await verifyPreparedToolUpdate(); process.exit(0); }
  if (command === '--create' && process.env.BOLNA_AGENT_ID?.trim()) { console.log('A BOLNA_AGENT_ID is already configured. Reusing it; no creation request sent.'); process.exit(0); }
  const prior = await readStatus();
  if (command === '--create' && prior?.state === 'created' && prior.agent_id) { await persistAgentId(prior.agent_id); console.log('Recovered the previously created agent ID into .env. No creation request sent.'); process.exit(0); }
  if (command === '--create' && ['pending', 'unknown'].includes(prior?.state)) throw new Error('An earlier creation has an unknown outcome. Check the Bolna dashboard and private receipt before any retry. No automatic retry or duplicate creation is allowed.');
  const voice = await selectVoice();
  if (command === '--catalog') { console.log(JSON.stringify({ catalog: 'authenticated read-only', selected: voice }, null, 2)); process.exit(0); }
  const request = await buildRequest(voice);
  await privateJson(resolve(privateDir, 'agent-request.private.json'), request);
  await privateJson(resolve(privateDir, 'agent-plan.json'), { provider: voice.provider, model: voice.model, voice: voice.voice, voice_id: voice.voice_id, language: 'en', llm: 'gpt-4.1-mini', transcriber: 'deepgram/nova-3', transport: 'freeswitch linear16; 16 kHz input / 24 kHz output', callbackOrigin: publicOrigin(), catalogCheckedAt: voice.catalogCheckedAt });
  if (command === '--prepare') { console.log('Prepared .bolna/agent-request.private.json using an authenticated current voice catalog. No agent created.'); process.exit(0); }
  const lockPath = resolve(privateDir, 'agent-create.lock');
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); } catch (error) { if (error.code === 'EEXIST') throw new Error('An agent-creation lock exists. Check the private receipt and dashboard; do not automatically retry.'); throw error; }
  const startedAt = new Date().toISOString();
  const requestHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
  await privateJson(statePath, { state: 'pending', startedAt, requestHash });
  let knownOutcome = false;
  try {
    const response = await fetch(`${API}/v2/agent`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(30000) });
    const data = await response.json().catch(() => null);
    if (response.status !== 201 || data?.state !== 'created' || typeof data.agent_id !== 'string') {
      knownOutcome = response.status >= 400 && response.status < 500;
      await privateJson(statePath, { state: knownOutcome ? 'rejected' : 'unknown', startedAt, requestHash, httpStatus: response.status, message: redact(data?.message || data?.detail || data?.error || 'Unexpected provider response; inspect the dashboard before retry.') });
      throw new Error(`Agent creation returned HTTP ${response.status}. ${knownOutcome ? 'Request rejected; private receipt saved.' : 'Outcome is unknown; do not retry automatically.'}`);
    }
    await privateJson(statePath, { state: 'created', startedAt, completedAt: new Date().toISOString(), requestHash, agent_id: data.agent_id, version_id: data.version_id || null });
    knownOutcome = true;
    await persistAgentId(data.agent_id);
    console.log('Created the SuryaLedger agent and saved BOLNA_AGENT_ID atomically in .env. Restart the local backend before testing. No outbound phone call was placed.');
  } catch (error) {
    const latest = await readStatus();
    if (latest?.state === 'pending') await privateJson(statePath, { state: 'unknown', startedAt, requestHash, message: 'Transport failed or timed out. Inspect the dashboard; never retry automatically.' });
    throw error;
  } finally {
    await lock.close();
    if (knownOutcome) await unlink(lockPath);
  }
} catch (error) { console.error(redact(error.message || 'Agent preparation failed.')); process.exitCode = 1; }
