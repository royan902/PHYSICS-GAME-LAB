import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sharedCssPath = path.join(
  rootDir,
  "public",
  "embedded-games",
  "shared",
  "newton.css",
);
const sharedThreePath = path.join(
  rootDir,
  "public",
  "embedded-games",
  "shared",
  "three-r128.min.js",
);

const sharedCss = fs.readFileSync(sharedCssPath, "utf8");
const threeJs = fs.readFileSync(sharedThreePath, "utf8");

function wrapKernelAsGlobal(kernelFile) {
  const kernelPath = path.join(rootDir, "src", "games", "motion-kernels", kernelFile);
  const raw = fs.readFileSync(kernelPath, "utf8");
  const exportNames = [];
  const stripped = raw
    .replace(/^export\s+(const|function)\s+([A-Za-z0-9_]+)/gm, (_, kind, name) => {
      exportNames.push(name);
      return `${kind} ${name}`;
    });

  return `(function (global) {\n${stripped}\n  global.MotionKernel = {\n    ${exportNames.join(",\n    ")}\n  };\n})(window);\n`;
}

const specs = [
  { slug: "golf", kernel: "golf.mjs", needsThree: true },
  { slug: "rocket-landing", kernel: "rocket-landing.mjs", needsThree: false },
  { slug: "cannon", kernel: "cannon.mjs", needsThree: true },
  { slug: "ramp-race", kernel: "ramp-race.mjs", needsThree: true },
];

for (const { slug, kernel, needsThree } of specs) {
  const dir = path.join(rootDir, "public", "games-html", slug);
  const templatePath = path.join(dir, "index.template.html");
  const gameJsPath = path.join(dir, "game.js");
  const outPath = path.join(dir, "index.html");

  if (!fs.existsSync(templatePath) || !fs.existsSync(gameJsPath)) {
    throw new Error(`Missing template or game.js for ${slug}`);
  }

  let html = fs.readFileSync(templatePath, "utf8");
  const kernelJs = wrapKernelAsGlobal(kernel);
  const gameJs = fs.readFileSync(gameJsPath, "utf8");

  html = html.replace("/* SHARED_CSS_PLACEHOLDER */", () => sharedCss);
  if (needsThree) {
    html = html.replace(
      '<script src="../../embedded-games/shared/three-r128.min.js"></script>',
      () => `<script>\n${threeJs}\n</script>`,
    );
  }
  html = html.replace(
    '<script src="./kernel-bundle.js"></script>',
    () => `<script>\n${kernelJs}\n</script>`,
  );
  html = html.replace(
    '<script src="./game.js"></script>',
    () => `<script>\n${gameJs}\n</script>`,
  );

  fs.writeFileSync(outPath, html, "utf8");
  console.log(`Built ${path.relative(rootDir, outPath)}`);
}
