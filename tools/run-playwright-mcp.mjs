import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.tools/playwright-output');
mkdirSync(output, { recursive: true });
const child = spawn(process.execPath, [
  resolve(root, 'tools/environment/node_modules/@playwright/mcp/cli.js'),
  '--browser', 'msedge', '--headless', '--isolated', '--sandbox',
  '--output-dir', output,
], { cwd: root, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { child.kill(signal); });
}
