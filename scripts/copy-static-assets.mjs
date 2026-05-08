import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");

if (!fs.existsSync(distDir)) {
  throw new Error("dist does not exist. Run vite build before copying static assets.");
}

copyDir("data", path.join(distDir, "data"));
copyDir(path.join("assets", "previews"), path.join(distDir, "assets", "previews"));

fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

function copyDir(relativeSource, target) {
  const source = path.join(projectRoot, relativeSource);
  if (!fs.existsSync(source)) return;
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}
