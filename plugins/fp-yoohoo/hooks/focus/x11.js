'use strict';

// Plain X11, via wmctrl or xdotool. Either one is enough; wmctrl is tried first
// because its pid-to-window listing needs no search heuristics.

const { run, has } = require('./exec');

function available() {
  if (process.env.XDG_SESSION_TYPE === 'wayland') return false;
  if (!process.env.DISPLAY) return false;
  return has('wmctrl') || has('xdotool');
}

function activePid() {
  const win = run('xdotool', ['getactivewindow']);
  if (!win) return 0;
  return Number(run('xdotool', ['getwindowpid', win])) || 0;
}

function raiseWmctrl(pid) {
  const list = run('wmctrl', ['-lp']);
  if (!list) return null;
  for (const line of list.split('\n')) {
    // "0x03400007  0 12345  host  Title"
    const cols = line.trim().split(/\s+/);
    if (Number(cols[2]) === pid) {
      return run('wmctrl', ['-ia', cols[0]]) === null ? null : 'raised';
    }
  }
  return 'nowindow';
}

function raiseXdotool(pid) {
  const found = run('xdotool', ['search', '--pid', String(pid)]);
  if (!found) return 'nowindow';
  const win = found.split('\n').pop().trim();
  return run('xdotool', ['windowactivate', win]) === null ? null : 'raised';
}

function raise(pid, { onlyWhenUnfocused = true } = {}) {
  if (onlyWhenUnfocused && has('xdotool') && activePid() === pid) return 'skipped';
  if (has('wmctrl')) {
    const res = raiseWmctrl(pid);
    if (res && res !== 'nowindow') return res;
  }
  if (has('xdotool')) return raiseXdotool(pid);
  return null;
}

module.exports = { name: 'x11', available, raise };
