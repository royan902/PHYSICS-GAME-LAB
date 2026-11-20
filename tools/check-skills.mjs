import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireTool = createRequire(resolve(root, 'tools/environment/package.json'));
const { parseDocument } = requireTool('yaml');
const expected = ['game-performance-optimizer', 'physics-game-dev', 'physics-validation', 'physics-web-dev', 'web-game-qa'];
const base = resolve(root, '.agents/skills');
assert.deepEqual(readdirSync(base).sort(), expected);

function parse(source) {
  const doc = parseDocument(source, { uniqueKeys: true });
  assert.equal(doc.errors.length, 0, doc.errors.map(e => e.message).join('\n'));
  return doc.toJS();
}

for (const name of expected) {
  const skill = readFileSync(resolve(base, name, 'SKILL.md'), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(skill);
  assert.ok(match, `${name}: missing frontmatter`);
  const metadata = parse(match[1]);
  assert.equal(metadata.name, name);
  assert.match(name, /^[a-z0-9-]{1,64}$/);
  assert.equal(typeof metadata.description, 'string');
  assert.ok(metadata.description.length > 0 && metadata.description.length <= 1024);
  assert.ok(!/[<>]/.test(metadata.description));
  assert.ok(Object.keys(metadata).every(key => ['name', 'description', 'metadata', 'license', 'allowed-tools'].includes(key)));
  for (const heading of ['## Workflow', '## Checklist', '## Kriteria keberhasilan']) {
    assert.ok(skill.includes(heading), `${name}: ${heading}`);
  }
  assert.ok(!skill.includes('[TODO:'));
  const ui = parse(readFileSync(resolve(base, name, 'agents/openai.yaml'), 'utf8'));
  assert.equal(typeof ui.interface.display_name, 'string');
  const short = ui.interface.short_description;
  assert.equal(typeof short, 'string');
  assert.ok(short.length >= 25 && short.length <= 64);
  assert.equal(short, metadata.metadata['short-description']);
  assert.notEqual(ui.policy?.allow_implicit_invocation, false);
  console.log(`PASS ${name}: full YAML parse, required fields, UI metadata, workflow/checklist/success criteria`);
}
