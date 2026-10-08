import { mkdir, copyFile } from "node:fs/promises";
await mkdir("dist/server", { recursive: true });
await copyFile("worker/index.js", "dist/server/index.js");
await copyFile("worker/page.js", "dist/server/page.js");
console.log("Worker hazır.");
