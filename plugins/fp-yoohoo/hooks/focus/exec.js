'use strict';

// Every backend shells out to whatever window manager tooling the desktop
// exposes. These wrappers make that uniform and, above all, safe to fail: a
// missing binary or a wedged compositor must never hold up a prompt, so
// everything is time-boxed and errors come back as null.

const { spawnSync } = require('child_process');

const TIMEOUT_MS = 2500;

function run(cmd, args, opts = {}) {
  try {
    const res = spawnSync(cmd, args, {
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    });
    if (res.error || res.status !== 0) return null;
    return (res.stdout || '').trim();
  } catch {
    return null;
  }
}

function has(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  return run(probe, [cmd]) !== null;
}

function json(cmd, args) {
  const out = run(cmd, args);
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

module.exports = { run, has, json, TIMEOUT_MS };
