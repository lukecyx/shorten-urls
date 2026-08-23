import esbuild from "esbuild";
import { rmSync, cpSync, mkdirSync } from "fs";
import { glob } from "glob";
import path from "path";

const outdir = "dist/nodejs/node_modules/encoding";

console.log("🔨 Building encoding layer...");

rmSync("dist", { recursive: true, force: true });

const entryPoints = glob.sync("src/**/*.ts", {
  ignore: ["**/*.test.ts", "**/*.spec.ts"],
});

console.log(`📦 Found ${entryPoints.length} source files`);

await esbuild.build({
  entryPoints,
  outdir,
  outbase: "src", // Preserve directory structure
  platform: "node",
  target: "node20",
  format: "cjs", // CommonJS for Lambda compatibility
  sourcemap: false,
  minify: false,
});

// Copy package.json
mkdirSync(outdir, { recursive: true });
cpSync("src/package.json", path.join(outdir, "package.json"));

console.log("✅ Layer built to dist/nodejs/node_modules/encoding/");
console.log("📊 Output structure:");
console.log("   dist/");
console.log("   └── nodejs/");
console.log("       └── node_modules/");
console.log("           └── encoding/");
console.log("               ├── feistelNetwork/");
console.log("               ├── base58/");
console.log("               └── index.js");
