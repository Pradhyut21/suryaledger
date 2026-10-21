import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyzeReport } from '../server/engine.mjs';

const cases = JSON.parse(await readFile(new URL('../evals/cases.json', import.meta.url), 'utf8'));
const results = cases.map((item) => {
  const turns = item.turns.map((text, i) => ({ id: `t${i + 1}`, role: item.roles?.[i] || 'technician', text }));
  const report = analyzeReport(turns);
  const checks = {
    status: report.status === item.expectedStatus,
    captured: item.expectedCaptured === undefined || report.completeness.captured === item.expectedCaptured,
    missing: !item.expectedMissing || item.expectedMissing.every((field) => report.missing.some((entry) => entry.field === field)),
    conflict: !item.expectedConflict || report.conflicts.some((entry) => entry.field === item.expectedConflict),
    provenance: Object.values(report.fields).filter(Boolean).every((fact) => turns.some((turn) => turn.id === fact.turnId && turn.role === 'technician' && turn.text.includes(fact.quote))),
    reviewBoundary: report.requiresSupervisorReview === true && !report.closed,
  };
  return { id: item.id, category: item.category, passed: Object.values(checks).every(Boolean), checks, actualStatus: report.status, expectedStatus: item.expectedStatus };
});
const passed = results.filter((result) => result.passed).length;
const output = {
  dataset: 'SuryaLedger synthetic text regression set v1',
  total: cases.length, passed, failed: cases.length - passed,
  limitations: 'Authored synthetic transcript cases, not independent user validation, real-call ASR accuracy, language coverage, safety accuracy, latency, or commercial evidence. The corpus is intentionally small and public.',
  results,
};
const outputPath = new URL('../evals/results.json', import.meta.url);
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`${passed}/${cases.length} synthetic regression cases passed. Results: ${fileURLToPath(outputPath)}`);
if (passed !== cases.length) { for (const result of results.filter((entry) => !entry.passed)) console.error(result); process.exitCode = 1; }
