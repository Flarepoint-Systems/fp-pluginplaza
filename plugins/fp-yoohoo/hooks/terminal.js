'use strict';

// Which window should come to the front? The hook runs as a grandchild of the
// terminal emulator, so we walk the parent chain up from this process until we
// meet a known emulator. That pid is what the focus backends match a window on.
//
// If the chain holds no emulator (tmux, ssh, a bare tty, a CI runner) there is
// no window to raise and we say so, so the caller can fall back to a bell.

const fs = require('fs');
const { spawnSync } = require('child_process');

const TERMINALS = new Set([
  'konsole', 'kitty', 'alacritty', 'wezterm-gui', 'wezterm', 'ghostty', 'foot',
  'gnome-terminal-', 'gnome-terminal-server', 'xfce4-terminal', 'terminator',
  'tilix', 'qterminal', 'lxterminal', 'mate-terminal', 'deepin-terminal',
  'contour', 'rio', 'urxvt', 'rxvt', 'xterm', 'st', 'termite', 'blackbox',
  'terminal', 'iterm2', 'iterm', 'hyper', 'tabby', 'warp', 'warpterminal',
  'windowsterminal', 'conhost', 'code', 'code-oss', 'cursor', 'codium',
]);

// Multiplexers and remote shells sit between us and any real window, so the
// ancestry above them belongs to a different machine or an invisible daemon.
const OPAQUE = new Set(['tmux', 'tmux: server', 'screen', 'sshd', 'mosh-server', 'dtach', 'zellij']);

function parentOf(pid) {
  try {
    // comm sits in parens and may itself contain spaces or a ')', so index from
    // the LAST ')': ppid is the second field after it.
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    return Number(fields[1]) || 0;
  } catch {
    const out = spawnSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8', timeout: 2000 });
    return Number((out.stdout || '').trim()) || 0;
  }
}

function commOf(pid) {
  try {
    return fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim();
  } catch {
    const out = spawnSync('ps', ['-o', 'comm=', '-p', String(pid)], { encoding: 'utf8', timeout: 2000 });
    const raw = (out.stdout || '').trim();
    return raw.slice(raw.lastIndexOf('/') + 1); // ps can hand back a full path
  }
}

function isTerminal(comm) {
  const name = comm.toLowerCase().replace(/\.(exe|app)$/, '');
  return TERMINALS.has(name);
}

// Returns { pid, comm } for the hosting terminal, or null when there is none.
function find(startPid = process.pid, { maxDepth = 24 } = {}) {
  let pid = startPid;
  for (let i = 0; i < maxDepth && pid > 1; i += 1) {
    const comm = commOf(pid);
    if (OPAQUE.has(comm.toLowerCase())) return null;
    if (isTerminal(comm)) return { pid, comm };
    const parent = parentOf(pid);
    if (!parent || parent === pid) break;
    pid = parent;
  }
  return null;
}

module.exports = { find, isTerminal, parentOf, commOf, TERMINALS, OPAQUE };
