import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// This creates a local private dashboard-import file. It never calls Bolna,
// places a call, publishes an endpoint, or prints the tool credential.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicBase = process.env.BOLNA_PUBLIC_BASE_URL;
const toolToken = process.env.BOLNA_TOOL_TOKEN;
if (!publicBase || !toolToken) {
  console.error('Set BOLNA_PUBLIC_BASE_URL and BOLNA_TOOL_TOKEN in your shell. No file written.');
  process.exit(1);
}
let parsed;
try { parsed = new URL(publicBase); } catch {
  console.error('BOLNA_PUBLIC_BASE_URL must be a valid HTTPS origin.');
  process.exit(1);
}
if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
  console.error('BOLNA_PUBLIC_BASE_URL must be an HTTPS origin without path, credentials, query, or fragment.');
  process.exit(1);
}
const tool = JSON.parse(await readFile(resolve(root, 'bolna/review-tool.example.json'), 'utf8'));
tool.value.url = `${parsed.origin}/api/bolna/report`;
tool.value.api_token = `Bearer ${toolToken}`;
const target = resolve(root, '.bolna');
await mkdir(target, { recursive: true });
await writeFile(resolve(target, 'review-tool.private.json'), `${JSON.stringify(tool, null, 2)}\n`, { mode: 0o600 });
console.log('Wrote .bolna/review-tool.private.json. Import it into the Bolna Tools tab. Keep it private.');
