'use strict';

// Which mode a session last received the full prior at. SessionStart sends the
// full prior and records it here; each prompt after that only needs a one-line
// reminder, unless the mode has changed since (a directive, the /mode command,
// another session), in which case the full prior for the new mode goes out again.
//
// Kept under the OS temp dir: it is per-session scratch, never user state.

const os = require('os');
const path = require('path');
const fs = require('fs');
const { atomicWrite } = require('./util');

function file(plugin, sessionId) {
  const safe = String(sessionId).replace(/[^\w-]/g, '_');
  return path.join(os.tmpdir(), 'flarepoint-primed', `${plugin}-${safe}`);
}

function get(plugin, sessionId) {
  if (!sessionId) return null;
  try {
    return fs.readFileSync(file(plugin, sessionId), 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function set(plugin, sessionId, mode) {
  if (!sessionId) return;
  try {
    atomicWrite(file(plugin, sessionId), `${mode}\n`);
  } catch {
    // unwritable tmp just means the next prompt re-sends the full prior
  }
}

// What to inject for this prompt: the full prior when the session isn't primed at
// this mode yet (or we can't tell), otherwise the reminder. Records the result.
function pick(plugin, sessionId, mode, { full = '', reminder = '' } = {}) {
  if (mode === 'off') return '';
  if (sessionId && get(plugin, sessionId) === mode) return reminder || full;
  set(plugin, sessionId, mode);
  return full;
}

module.exports = { get, set, pick, file };
