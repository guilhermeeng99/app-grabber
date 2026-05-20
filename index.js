#!/usr/bin/env node
/**
 * Play Grabber
 * Search a Google Play app by name and download its icon + promotional
 * images (screenshots and feature graphic) in the highest resolution.
 *
 * Usage:
 *   node index.js "app name"
 *   node index.js "app name" --country br --lang pt
 *   node index.js --id com.kainsuite.capycare
 */

import gplay from "google-play-scraper";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- arg parsing ----------
function parseArgs(argv) {
  const opts = { country: "us", lang: "en", id: null, term: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--country" || a === "-c") opts.country = argv[++i];
    else if (a === "--lang" || a === "-l") opts.lang = argv[++i];
    else if (a === "--id") opts.id = argv[++i];
    else rest.push(a);
  }
  opts.term = rest.join(" ").trim();
  return opts;
}

// ---------- helpers ----------
/**
 * Force a Google user-content image URL to its maximum resolution.
 * Play images are served via play-lh.googleusercontent.com. With no size
 * suffix they default to ~512px on the longest side; with a suffix like
 * "=w526-h296" they are scaled to that box. Stripping any existing suffix
 * and appending "=s0" returns the original (largest) asset.
 */
function maxRes(url) {
  if (!url) return url;
  return url.replace(/=[^/]*$/, "") + "=s0";
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function extFromUrl(url, fallback = ".png") {
  const clean = url.split("?")[0].split("=")[0];
  const m = clean.match(/\.(png|jpe?g|webp|gif)$/i);
  return m ? `.${m[1].toLowerCase()}` : fallback;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return buf.length;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---------- main ----------
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.id && !opts.term) {
    console.error(
      [
        "Play Grabber - download Google Play app assets in high resolution",
        "",
        "Usage:",
        '  node index.js "app name"',
        '  node index.js "app name" --country br --lang pt',
        "  node index.js --id com.package.name",
      ].join("\n"),
    );
    process.exit(1);
  }

  // Resolve the app id.
  let appId = opts.id;
  if (!appId) {
    console.log(`Searching for "${opts.term}" ...`);
    const results = await gplay.search({
      term: opts.term,
      num: 1,
      country: opts.country,
      lang: opts.lang,
    });
    if (!results.length) {
      console.error("No app found for that name.");
      process.exit(2);
    }
    appId = results[0].appId;
    console.log(`Top match: ${results[0].title}  (${appId})`);
  }

  // Fetch full details.
  const app = await gplay.app({
    appId,
    country: opts.country,
    lang: opts.lang,
  });

  const folderName = slugify(app.title || appId);
  const outDir = path.join(__dirname, "downloads", folderName);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`\n${app.title}`);
  console.log(`Developer: ${app.developer}`);
  console.log(`Saving to: ${outDir}\n`);

  // Build the asset list.
  const assets = [];
  if (app.icon) assets.push({ url: maxRes(app.icon), name: "icon" });
  if (app.headerImage)
    assets.push({ url: maxRes(app.headerImage), name: "feature-graphic" });
  (app.screenshots || []).forEach((url, i) => {
    assets.push({
      url: maxRes(url),
      name: `screenshot-${String(i + 1).padStart(2, "0")}`,
    });
  });

  // Download everything.
  let ok = 0;
  for (const a of assets) {
    const file = `${a.name}${extFromUrl(a.url)}`;
    const dest = path.join(outDir, file);
    try {
      const size = await download(a.url, dest);
      console.log(`  + ${file}  (${humanSize(size)})`);
      ok++;
    } catch (err) {
      console.error(`  ! ${file}  failed: ${err.message}`);
    }
  }

  console.log(`\nDone. ${ok}/${assets.length} files saved in ${outDir}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
