import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requireTool = createRequire(
  resolve(root, "tools/environment/package.json"),
);
const manifest = requireTool("chrome-devtools-mcp/package.json");
const cli = resolve(
  root,
  "tools/environment/node_modules/chrome-devtools-mcp",
  manifest.bin["chrome-devtools-mcp"],
);
const child = spawn(
  process.execPath,
  [
    cli,
    "--headless",
    "--isolated",
    "--no-usage-statistics",
    "--no-performance-crux",
  ],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
