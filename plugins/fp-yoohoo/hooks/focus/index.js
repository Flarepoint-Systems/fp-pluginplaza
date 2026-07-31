'use strict';

// Backend selection. Each one reports whether this desktop is its own, and the
// first that claims it gets the raise; a backend that claims the desktop but
// then fails hands off to the next rather than ending the chain, because
// "available" only means the tooling is installed.
//
// Outcomes: 'raised' | 'skipped' (already focused) | 'nowindow' | 'alerted'
// (fallback noise) | null (nothing could act).

const terminal = require('../terminal');
const fallback = require('./fallback');

const BACKENDS = [
  require('./kde'),
  require('./wlroots'),
  require('./x11'),
  require('./macos'),
  require('./windows'),
];

function detect(backends = BACKENDS) {
  return backends.filter((b) => {
    try {
      return b.available();
    } catch {
      return false;
    }
  });
}

// Raise the window hosting this session. `alert` carries the text used if we end
// up making noise instead.
function bringToFront({ onlyWhenUnfocused = true, alert = {}, backends = BACKENDS } = {}) {
  const host = terminal.find();
  if (!host) return { outcome: fallback.alert(alert), backend: 'fallback', pid: null };

  for (const backend of detect(backends)) {
    let outcome = null;
    try {
      outcome = backend.raise(host.pid, { onlyWhenUnfocused });
    } catch {
      outcome = null;
    }
    if (outcome === 'raised' || outcome === 'skipped') return { outcome, backend: backend.name, pid: host.pid };
    if (outcome === 'flashed') return { outcome: 'alerted', backend: backend.name, pid: host.pid };
  }

  return { outcome: fallback.alert(alert), backend: 'fallback', pid: host.pid };
}

module.exports = { BACKENDS, detect, bringToFront, fallback };
