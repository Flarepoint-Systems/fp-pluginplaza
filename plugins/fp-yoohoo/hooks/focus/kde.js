'use strict';

// KDE Plasma (Wayland and X11).
//
// Wayland forbids a client from raising itself, so we hand the job to the only
// process allowed to do it: KWin. It runs JS plugins loaded over D-Bus, and a
// script running inside the compositor is not subject to focus-stealing
// prevention. The dance is load -> run -> unload, with a unique plugin name each
// time because KWin caches a loaded script by name and would otherwise hand back
// the previous one without re-running it.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { run, has } = require('./exec');

const DEST = 'org.kde.KWin';

function available() {
  const desktop = `${process.env.XDG_CURRENT_DESKTOP || ''} ${process.env.DESKTOP_SESSION || ''}`.toLowerCase();
  if (!/kde|plasma/.test(desktop)) return false;
  return has('gdbus') || has('busctl');
}

// KWin 6 renamed the window APIs; both spellings are tried so Plasma 5 still works.
function script(pid, onlyWhenUnfocused) {
  return `var TARGET = ${pid};
var list = (typeof workspace.windowList === 'function') ? workspace.windowList() : workspace.clientList();
var active = workspace.activeWindow || workspace.activeClient;
if (!(${onlyWhenUnfocused ? 'true' : 'false'} && active && active.pid === TARGET)) {
  for (var i = 0; i < list.length; i++) {
    var w = list[i];
    if (w.pid !== TARGET || !w.normalWindow) continue;
    try { if (w.minimized) w.minimized = false; } catch (e) {}
    try { if (!w.onAllDesktops && w.desktops && w.desktops.length) workspace.currentDesktop = w.desktops[0]; } catch (e) {}
    if ('activeWindow' in workspace) workspace.activeWindow = w; else workspace.activeClient = w;
    break;
  }
}
`;
}

function call(objectPath, iface, method, args = []) {
  if (has('gdbus')) {
    return run('gdbus', ['call', '--session', '--dest', DEST, '--object-path', objectPath,
      '--method', `${iface}.${method}`, ...args]);
  }
  if (has('busctl')) {
    const sig = args.length ? [args.map(() => 's').join('')] : [];
    return run('busctl', ['--user', 'call', DEST, objectPath, iface, method, ...sig, ...args]);
  }
  return null;
}

function raise(pid, { onlyWhenUnfocused = true } = {}) {
  const name = `fp-yoohoo-${process.pid}-${Date.now()}`;
  const file = path.join(os.tmpdir(), `${name}.js`);
  try {
    fs.writeFileSync(file, script(pid, onlyWhenUnfocused));
    const loaded = call('/Scripting', 'org.kde.kwin.Scripting', 'loadScript', [file, name]);
    const id = loaded && /(-?\d+)/.exec(loaded);
    if (!id || Number(id[1]) < 0) return null;
    call(`/Scripting/Script${Number(id[1])}`, 'org.kde.kwin.Script', 'run');
    return 'raised';
  } catch {
    return null;
  } finally {
    // Leaving scripts loaded would pile up inside the compositor for the whole
    // session, so unload and delete even when the run above threw.
    call('/Scripting', 'org.kde.kwin.Scripting', 'unloadScript', [name]);
    try { fs.rmSync(file, { force: true }); } catch {}
  }
}

module.exports = { name: 'kde', available, raise, script };
