'use strict';

// Hyprland and sway (and sway-compatible wlroots compositors). Both expose an
// IPC that can focus a window by its own handle, so the work is turning a pid
// into that handle.

const { run, json } = require('./exec');

function isHyprland() {
  return Boolean(process.env.HYPRLAND_INSTANCE_SIGNATURE) && json('hyprctl', ['-j', 'version']) !== null;
}

function isSway() {
  return Boolean(process.env.SWAYSOCK) && json('swaymsg', ['-t', 'get_version', '-r']) !== null;
}

function available() {
  return isHyprland() || isSway();
}

function raiseHyprland(pid, onlyWhenUnfocused) {
  const active = json('hyprctl', ['-j', 'activewindow']);
  if (onlyWhenUnfocused && active && active.pid === pid) return 'skipped';
  const clients = json('hyprctl', ['-j', 'clients']);
  if (!Array.isArray(clients)) return null;
  const hit = clients.find((c) => c.pid === pid);
  if (!hit) return 'nowindow';
  return run('hyprctl', ['dispatch', 'focuswindow', `address:${hit.address}`]) === null ? null : 'raised';
}

// sway's tree is nested, so flatten every node and pick the one carrying our pid.
function swayNodes(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  out.push(node);
  for (const child of [...(node.nodes || []), ...(node.floating_nodes || [])]) swayNodes(child, out);
  return out;
}

function raiseSway(pid, onlyWhenUnfocused) {
  const tree = json('swaymsg', ['-t', 'get_tree', '-r']);
  if (!tree) return null;
  const nodes = swayNodes(tree);
  const hit = nodes.find((n) => n.pid === pid && n.type !== 'workspace');
  if (!hit) return 'nowindow';
  if (onlyWhenUnfocused && hit.focused) return 'skipped';
  return run('swaymsg', ['-r', `[con_id=${hit.id}]`, 'focus']) === null ? null : 'raised';
}

function raise(pid, { onlyWhenUnfocused = true } = {}) {
  if (isHyprland()) return raiseHyprland(pid, onlyWhenUnfocused);
  if (isSway()) return raiseSway(pid, onlyWhenUnfocused);
  return null;
}

module.exports = { name: 'wlroots', available, raise, swayNodes };
