'use strict';

// Small dependency-free helpers shared across fp-base modules.
// No external packages: just node built-ins, so the vendored copy runs anywhere
// `node` is on PATH.

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Write via a temp file + rename so a crashed/interrupted write never leaves a
// half-written fact or config on disk.
function atomicWrite(file, contents) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, file);
  return file;
}

function readJSON(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file, value) {
  return atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`);
}

// Deep-ish merge for plain config objects: later sources win, nested objects
// merge, everything else is replaced. Good enough for our flat-ish config trees.
function mergeConfig(...sources) {
  const out = {};
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const [k, v] of Object.entries(src)) {
      if (v && typeof v === 'object' && !Array.isArray(v) &&
          out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = mergeConfig(out[k], v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

// Hook payload from stdin as an object; {} when absent or malformed.
function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, ''); // strip BOM some shells add
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

module.exports = {
  ensureDir,
  atomicWrite,
  readJSON,
  writeJSON,
  mergeConfig,
  readHookInput,
};
