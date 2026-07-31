'use strict';

// macOS. System Events can front an app by its unix id, which saves mapping
// TERM_PROGRAM onto an application name and works for any terminal.

const { run } = require('./exec');

function available() {
  return process.platform === 'darwin';
}

function osascript(source) {
  return run('osascript', ['-e', source]);
}

function raise(pid, { onlyWhenUnfocused = true } = {}) {
  if (onlyWhenUnfocused) {
    const front = osascript('tell application "System Events" to get unix id of (first process whose frontmost is true)');
    if (front && Number(front) === pid) return 'skipped';
  }
  const out = osascript(`tell application "System Events" to set frontmost of (first process whose unix id is ${pid}) to true`);
  return out === null ? 'nowindow' : 'raised';
}

module.exports = { name: 'macos', available, raise };
