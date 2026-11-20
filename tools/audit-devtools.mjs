import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const child = spawn(
  process.execPath,
  [resolve(root, "tools/run-devtools-mcp.mjs")],
  {
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  },
);
let sequence = 0;
let stderr = "";
const pending = new Map();
child.stderr.on("data", (bytes) => {
  stderr = (stderr + bytes.toString()).slice(-8000);
});
const lines = createInterface({ input: child.stdout });
lines.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  const call = pending.get(message.id);
  if (!call) return;
  clearTimeout(call.timer);
  pending.delete(message.id);
  if (message.error) call.reject(new Error(JSON.stringify(message.error)));
  else call.resolve(message.result);
});
function rejectPending(error) {
  for (const call of pending.values()) {
    clearTimeout(call.timer);
    call.reject(error);
  }
  pending.clear();
}
child.on("error", rejectPending);
child.on("exit", (code) =>
  rejectPending(new Error(`MCP exited ${code}: ${stderr}`)),
);
function request(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolveCall, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout: ${method}`));
    }, 45000);
    pending.set(id, { resolve: resolveCall, reject, timer });
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
    );
  });
}
async function tool(name, args) {
  const result = await request("tools/call", { name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  return result;
}

try {
  const server = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "physics-game-lab-devtools-audit", version: "1.0.0" },
  });
  child.stdin.write(
    JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
      "\n",
  );
  const { tools } = await request("tools/list");
  console.log(
    "PASS Chrome DevTools MCP initialize:",
    JSON.stringify(server.serverInfo),
    "tools:",
    tools.length,
  );
  const opened = await tool("new_page", { url: "about:blank" });
  const selected = opened.content
    .filter((x) => x.type === "text")
    .map((x) => x.text)
    .join("\n")
    .match(/(\d+):[^\n]*\[selected\]/);
  assert.ok(selected, "No selected page ID in new_page response");
  const pageId = Number(selected[1]);
  const result = await tool("evaluate_script", {
    pageId,
    function:
      '() => ({url: location.href, userAgent: navigator.userAgent, wasm: typeof WebAssembly === "object"})',
  });
  console.log(JSON.stringify(result));
  mkdirSync(resolve(root, ".tools"), { recursive: true });
  writeFileSync(
    resolve(root, ".tools/devtools-audit.json"),
    JSON.stringify(
      { server: server.serverInfo, toolCount: tools.length, result },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.stack, stderr);
  process.exitCode = 1;
} finally {
  child.stdin.end();
  await new Promise((done) => {
    if (child.exitCode !== null) return done();
    const timer = setTimeout(() => {
      child.kill();
      done();
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timer);
      done();
    });
  });
  lines.close();
}
