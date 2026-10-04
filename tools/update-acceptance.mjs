import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only explicit acceptance IDs attached to executed assertions are accepted as
// evidence. Unmapped cases remain NOT RUN; counting test files proves nothing.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(root, 'docs/history/0.1/acceptance-results.json');
const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('Usage: node tools/update-acceptance.mjs artifacts/unit.tap [artifacts/browser.tap]');
  process.exitCode = 2;
} else {
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const byId = new Map(ledger.cases.map(item => [item.id, item]));
  for (const item of ledger.cases) {
    item.status = 'NOT RUN';
    item.actualTests = [];
    item.evidence = [];
  }
  let matchedAssertions = 0;
  for (const input of inputs) {
    const absolute = path.resolve(root, input);
    const content = fs.readFileSync(absolute, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*(not )?ok\s+\d+\s+-\s+(.+)$/);
      if (!match) continue;
      const title = match[2];
      const ids = [...new Set(title.match(/\b(?:G|S|D|C|R|P|U)\d{2}\b/g) || [])];
      for (const id of ids) {
        const item = byId.get(id);
        if (!item) continue;
        const skipped = /#\s*(?:SKIP|TODO)\b/i.test(title);
        const status = skipped ? 'NOT RUN' : match[1] ? 'FAIL' : 'PASS';
        if (status === 'FAIL' || (status === 'PASS' && item.status !== 'FAIL')) item.status = status;
        item.actualTests.push({ title: title.replace(/\s*#.*$/, ''), status });
        const evidence = path.relative(root, absolute).replaceAll(path.sep, '/');
        if (!item.evidence.includes(evidence)) item.evidence.push(evidence);
        matchedAssertions++;
      }
    }
  }
  ledger.counts = { defined: ledger.cases.length, PASS: 0, FAIL: 0, 'NOT RUN': 0, 'OUT OF SCOPE': 0 };
  for (const item of ledger.cases) ledger.counts[item.status]++;
  ledger.lastEvidenceUpdate = new Date().toISOString();
  ledger.lastEvidenceInputs = inputs;
  fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(JSON.stringify({ ...ledger.counts, matchedAssertions }));
}
