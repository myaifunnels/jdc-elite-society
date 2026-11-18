// Renders every poster in src/roster.ts POSTERS to out/<id>.png.
// Usage: npm run render            (all posters)
//        npm run render -- <id>    (one poster)
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const only = process.argv[2];
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
// Set REMOTION_CHROME to use a specific Chrome/Chromium binary; otherwise Remotion downloads its own.
const browserExecutable = process.env.REMOTION_CHROME || null;
const comps = await getCompositions(serveUrl, { browserExecutable });
fs.mkdirSync("out", { recursive: true });
for (const c of comps) {
  if (only && c.id !== only) continue;
  const composition = await selectComposition({ serveUrl, id: c.id, browserExecutable });
  const output = `out/${c.id}.png`;
  await renderStill({ serveUrl, composition, output, imageFormat: "png", browserExecutable });
  console.log("rendered", output);
}
