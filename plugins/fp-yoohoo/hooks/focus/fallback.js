'use strict';

// The last resort, and the whole of `hint` mode: make noise where the window is
// instead of moving it. The bell is what marks a taskbar entry as urgent in most
// terminals, and the desktop notification survives the case where the terminal
// lives somewhere we cannot reach at all (tmux, ssh, an unknown compositor).

const fs = require('fs');
const { run, has } = require('./exec');

function bell() {
  try {
    fs.writeFileSync('/dev/tty', '\u0007');
    return true;
  } catch {
    try {
      process.stderr.write('\u0007');
      return true;
    } catch {
      return false;
    }
  }
}

function desktopNotify(title, body) {
  if (process.platform === 'darwin') {
    const esc = (s) => String(s).replace(/["\\]/g, '\\$&');
    return run('osascript', ['-e', `display notification "${esc(body)}" with title "${esc(title)}"`]) !== null;
  }
  if (!has('notify-send')) return false;
  return run('notify-send', ['--app-name=Claude Code', '--urgency=critical', title, body]) !== null;
}

function alert({ title = 'Claude Code', body = 'is waiting for you' } = {}) {
  const rang = bell();
  const notified = desktopNotify(title, body);
  return rang || notified ? 'alerted' : null;
}

module.exports = { name: 'fallback', available: () => true, raise: () => null, alert, bell, desktopNotify };
