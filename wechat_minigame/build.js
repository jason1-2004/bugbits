#!/usr/bin/env node
/**
 * BugBits WeChat Mini Game Build Script
 * Concatenates: wx_adapter.js + game.js + game_monetize.js
 * Usage: node build.js
 */
const fs = require("fs");
const path = require("path");

const dirs = {
  wx: __dirname,
  web: path.resolve(__dirname, "..", "bugbits-web"),
};

const inputFiles = [
  path.join(dirs.wx, "js", "wx_adapter.js"),
  path.join(dirs.web, "game.js"),
  path.join(dirs.web, "game_monetize.js"),
];

const output = [];
output.push("// BugBits WeChat Mini Game v2.0");
output.push("// Build: " + new Date().toISOString().replace("T", " ").substring(0, 19));
output.push("// ============================================================");

for (const f of inputFiles) {
  try {
    const content = fs.readFileSync(f, "utf8");
    output.push("");
    output.push("// === " + path.basename(f) + " ===");
    output.push(content);
    console.log("  + " + path.basename(f) + " (" + content.length + "B)");
  } catch (e) {
    console.error("  ! " + path.basename(f) + ": " + e.message);
  }
}

const outputPath = path.join(dirs.wx, "game.js");
const combined = output.join("\n");
fs.writeFileSync(outputPath, combined, "utf8");

console.log("Build complete:");
console.log("  Output: " + outputPath);
console.log("  Size: " + (combined.length / 1024).toFixed(1) + " KB");
console.log("  Lines: " + combined.split("\n").length);
