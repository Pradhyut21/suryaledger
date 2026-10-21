# Connect a real Bolna voice agent

The app includes a live browser-call integration and a deterministic local evidence engine. A working replay does not establish that Bolna is configured. A real call needs your Bolna account, funded credits, an agent, microphone permission, and a reachable backend for the tool callback. No real call was placed while authoring these instructions.

## 1. Create the agent

Create a conversation agent in [Bolna's dashboard](https://platform.bolna.ai). Use a supported English ASR/voice combination for the first test. Paste [the system prompt](../bolna/system-prompt.md) into the prompt editor. Keep both variables: `{job_id}` is a fresh private routing key for this call; `{site_id}` is the assigned site reference. The key must not be spoken aloud or extracted as the technician's site ID. Configure a short AI introduction and ask for permission to collect the report.

Copy the agent ID. Generate a Bolna API key from the Developers section. Put `BOLNA_API_KEY` and `BOLNA_AGENT_ID` in the backend environment, never in a Vite-prefixed variable or browser bundle. The app session endpoint is `POST /api/bolna/session`.

## 2. Add the report-review tool

The callback endpoint must be reachable over HTTPS from Bolna. For a developer test, use a tunnel or a deployed backend with a dedicated test dataset. A tunnel exposes local routes; restrict access before using real customer data. The current local prototype is not a multi-tenant production service.

Set `BOLNA_TOOL_TOKEN` on the app backend. Use a distinct, randomly generated secret, not the Bolna account key. Set `BOLNA_PUBLIC_BASE_URL` to the public origin, then run:

```powershell
$env:BOLNA_PUBLIC_BASE_URL = 'https://your-test-backend.example'
# Set BOLNA_TOOL_TOKEN securely in this shell; do not commit it.
node scripts/prepare-bolna.mjs
```

The script creates `.bolna/review-tool.private.json` without making external API calls or printing the secret. Ensure `.bolna/` is in `.gitignore`. In Bolna's Tools tab, choose Custom Function → Write manually and paste the generated JSON. Alternatively adapt [the example schema](../bolna/review-tool.example.json) manually. The example's URL and token are placeholders.

The tool posts `{ "job_id": "...", "report_text": "latest technician utterance" }` to `/api/bolna/report` with `Authorization: Bearer <BOLNA_TOOL_TOKEN>`. The backend returns a report with the next clarification. It refuses to infer missing evidence. No model result directly approves a work order.

The UI polls `GET /api/jobs/:id/report` using the fresh call-routing key as `id`. Only successfully minted, unexpired routing keys can submit tool evidence; the server retains their assigned-site correlation. A wrong reported site holds the record. Polling continues briefly after hangup to collect late tool updates. These in-memory demo endpoints and keys are not a tenant security model. Restarting the backend clears call state.

Tool text is model-mediated. Its quoted provenance refers to the submitted tool text, not an independently verified provider recording. Before production use, correlate it with provider transcript events and check source spans against those events.

## 3. Start and verify the real call

Install dependencies and start the app using the repository README. Confirm the backend reports Bolna configuration present, then choose the live Bolna call action. Start from a user click, grant microphone permission, and use headphones if echo occurs. Browser production use requires HTTPS; localhost is suitable for development.

Use a synthetic job. Say an intentionally incomplete report. Verify that:

1. You hear the actual agent and the UI says the live call is active.
2. A callback reaches `/api/bolna/report` with the correct fixed job ID and original caller wording.
3. Missing measurement or acknowledgement remains pending, even if you ask the agent to mark it complete.
4. A correction updates the appropriate evidence and keeps source text visible.
5. The result is only ready for human review, not physical verification or automatic job closure.
6. Denied microphone permission, disconnected network, insufficient credits, and tool failure show a useful error.

Record the actual execution ID, input utterances, expected and observed results, and failures in a separate live-test record. Do not relabel local text tests as speech accuracy. Never use real customer names or numbers in the public demo.

## Exact provider contract

The frontend uses the official `@bolna/web-call` package:

```js
import { BolnaWebCall } from '@bolna/web-call';
const call = new BolnaWebCall({
  sessionUrl: '/api/bolna/session',
  userData: { job_id: `${activeSiteId}_${crypto.randomUUID()}`, site_id: activeSiteId }
});
call.on('call-start', () => setConnected(true));
call.on('error', ({ code, message }) => showError(code, message));
await call.start(); // call from a user gesture
// await call.stop();
```

The server forwards a session request to `POST https://api.bolna.ai/web-call/freeswitch-session` with Bearer authentication, the configured `agent_id`, and allowlisted `user_data.job_id` and `user_data.site_id`. It returns the mint response as-is; session fields are owned by the SDK. Account credentials stay on the server. Sessions are short-lived and single-use. [Official SDK](https://github.com/bolna-ai/web-call)

Custom functions require `key: "custom_task"`, the parameter definition, and a `value` transport block. `value.param` uses `%(name)s` mapping, and `api_token` includes the `Bearer ` prefix. Parameters and mapping names must match. When firewall rules are needed, the currently documented provider source IPs are `13.203.39.153`, `13.126.9.249`, and `13.202.133.53`. [Schema reference](https://www.bolna.ai/docs/tool-calling/custom-function-schema), [Function guide](https://www.bolna.ai/docs/tool-calling/custom-function-calls)

For post-call validation, wait for `completed`, not `call-disconnected`, before reading final execution data. If you automate agent creation, use `/v2/agent` and expect HTTP 201 with `state`; old `/agent` examples are deprecated. No signature-authentication claim is made for provider webhooks. [API quickstart](https://www.bolna.ai/docs/quickstarts/api), [API gotchas](https://www.bolna.ai/docs/agents-md)

Documentation checked 21 October 2026. Account availability, provider prices, language combinations, and live end-to-end behavior still require verification using your account.
