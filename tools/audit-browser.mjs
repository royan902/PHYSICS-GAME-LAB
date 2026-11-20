import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, [resolve(root, 'tools/run-playwright-mcp.mjs')], {
  cwd: root, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
});
let sequence = 0;
let stderr = '';
const pending = new Map();
child.stderr.on('data', bytes => { stderr = (stderr + bytes.toString()).slice(-8000); });
const lines = createInterface({ input: child.stdout });
lines.on('line', line => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  const call = pending.get(message.id);
  if (!call) return;
  clearTimeout(call.timer);
  pending.delete(message.id);
  if (message.error) call.reject(new Error(JSON.stringify(message.error)));
  else call.resolve(message.result);
});
function rejectPending(error) {
  for (const call of pending.values()) { clearTimeout(call.timer); call.reject(error); }
  pending.clear();
}
child.on('error', rejectPending);
child.on('exit', code => rejectPending(new Error(`MCP exited ${code}: ${stderr}`)));
function request(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolveCall, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 45000);
    pending.set(id, { resolve: resolveCall, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
async function tool(name, args) {
  const result = await request('tools/call', { name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  return result;
}

try {
  const server = await request('initialize', {
    protocolVersion: '2024-11-05', capabilities: {},
    clientInfo: { name: 'physics-game-lab-environment-audit', version: '1.0.0' },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const { tools } = await request('tools/list');
  assert.ok(['browser_navigate', 'browser_evaluate', 'browser_close'].every(name => tools.some(t => t.name === name)));
  console.log('PASS MCP initialize + tools/list:', JSON.stringify(server.serverInfo));
  await tool('browser_navigate', { url: 'about:blank' });
  const result = await tool('browser_evaluate', { function: `async () => {
    function probe(type) {
      const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
      const gl = canvas.getContext(type);
      if (!gl) return { supported: false };
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      gl.clearColor(0, 1, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      const pixel = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      const out = { supported: true, version: gl.getParameter(gl.VERSION),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        pixel: [...pixel], error: gl.getError() };
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return out;
    }
    let wasm = false;
    try { await WebAssembly.instantiate(new Uint8Array([0,97,115,109,1,0,0,0])); wasm = true; } catch {}
    return { userAgent: navigator.userAgent, webgl: probe('webgl'), webgl2: probe('webgl2'),
      wasm, pointerEvents: 'PointerEvent' in window, requestAnimationFrame: typeof requestAnimationFrame === 'function' };
  }` });
  const text = result.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
  console.log('BROWSER RESULT\n' + text);
  const match = /### Result\s*\n([\s\S]*?)(?=\n### |$)/.exec(text);
  assert.ok(match, 'Cannot extract browser result');
  const browser = JSON.parse(match[1]);
  for (const key of ['webgl', 'webgl2']) {
    assert.ok(browser[key].supported, `${key} unsupported`);
    assert.deepEqual(browser[key].pixel, [0, 255, 0, 255]);
    assert.equal(browser[key].error, 0);
  }
  assert.ok(browser.wasm && browser.pointerEvents && browser.requestAnimationFrame);
  mkdirSync(resolve(root, '.tools'), { recursive: true });
  writeFileSync(resolve(root, '.tools/browser-audit.json'), JSON.stringify({
    server: server.serverInfo, protocol: server.protocolVersion, toolCount: tools.length,
    browser, scope: 'Isolated local desktop Edge headless capability smoke; no Next.js or game test',
  }, null, 2) + '\n');
  console.log('PASS browser navigation, WebGL/WebGL2 pixel readback, WASM, PointerEvent, RAF');
} catch (error) {
  console.error(error.stack);
  if (stderr) console.error(stderr);
  process.exitCode = 1;
} finally {
  try { await tool('browser_close', {}); } catch {}
  child.stdin.end();
  await new Promise(resolveExit => {
    if (child.exitCode !== null) return resolveExit();
    const timer = setTimeout(() => { child.kill(); resolveExit(); }, 5000);
    child.once('exit', () => { clearTimeout(timer); resolveExit(); });
  });
  lines.close();
}
