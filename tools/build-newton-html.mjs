import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../public/embedded-games/", import.meta.url);
const css = await readFile(new URL("shared/newton.css", root), "utf8");
const three = await readFile(new URL("shared/three-r128.min.js", root), "utf8");
const inlineScript = (source) => source.replace(/<\/script/gi, "<\\/script");
for (const slug of [
  "newton-first-law",
  "newton-second-law",
  "newton-third-law",
]) {
  const folder = new URL(`${slug}/`, root);
  const template = await readFile(
    new URL("index.template.html", folder),
    "utf8",
  );
  const game = await readFile(new URL("game.js", folder), "utf8");
  // Authenticated previews cannot reliably send cookies from opaque sandbox subresources.
  const html = template
    .replace(
      '<link rel="stylesheet" href="../shared/newton.css" />',
      () => `<style>${css}</style>`,
    )
    .replace(
      /<script\s+src="\.\.\/shared\/three-r128\.min\.js"[\s\S]*?<\/script>/,
      () => `<script>${inlineScript(three)}</script>`,
    )
    .replace(
      '<script src="./game.js"></script>',
      () => `<script>${inlineScript(game)}</script>`,
    )
    .replace(
      '<link rel="icon" href="/icon.svg" />',
      '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E" />',
    );
  if (
    html === template ||
    /(?:src="(?:\.\/game|\.\.\/shared\/three)|href="\.\.\/shared\/newton)/.test(
      html,
    )
  ) {
    throw new Error(`Standalone template was not fully bundled: ${slug}`);
  }
  await writeFile(new URL("index.html", folder), html);
}
console.log("Prepared three self-contained Newton documents.");
