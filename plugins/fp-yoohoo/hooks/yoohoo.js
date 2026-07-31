'use strict';

// Shared setup for every fp-yoohoo hook: load the (symlinked or dev) base,
// declare the mode levels once, and resolve the settings the Notification hook
// filters on.
//
// fp-yoohoo is the plaza's only *mechanical* plugin: it injects nothing, reads
// no transcript, and shapes nothing the model says. It watches for the moments
// Claude Code stops and waits on a human, and puts the terminal back in front of
// that human. Everything below is plumbing for that one act.

function loadBase() {
  try {
    return require('./_fpbase'); // production: the symlinked base
  } catch {
    return require('@flarepoint/base'); // dev/test fallback
  }
}

const base = loadBase();
const PLUGIN = 'yoohoo';

// on   raise the window (skipping the raise when it already has focus)
// hint attention only: terminal bell + desktop notification, never a focus steal
base.mode.define(PLUGIN, { levels: ['on', 'hint'], default: 'on' });

// Notification types that mean "a human is being waited on". hooks.json also
// registers idle_prompt, deliberately left out of the default so the 60s idle
// tick stays quiet until someone opts in.
const DEFAULT_TRIGGERS = ['permission_prompt', 'elicitation_dialog', 'agent_needs_input'];

const DEFAULTS = {
  triggers: DEFAULT_TRIGGERS,
  only_when_unfocused: true,
  cooldown_ms: 1000, // collapses a burst of prompts into one raise
};

function settings(opts = {}) {
  const cfg = base.config.load(PLUGIN, { defaults: DEFAULTS, ...opts });
  return {
    triggers: parseTriggers(cfg.triggers),
    onlyWhenUnfocused: cfg.only_when_unfocused !== false,
    cooldownMs: Number(cfg.cooldown_ms) || 0,
  };
}

// Accepts an array from config.json or a comma-separated FLAREPOINT_YOOHOO_TRIGGERS.
function parseTriggers(value) {
  if (Array.isArray(value)) return value.map((t) => String(t).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean);
  return DEFAULT_TRIGGERS.slice();
}

module.exports = { base, PLUGIN, DEFAULTS, DEFAULT_TRIGGERS, settings, parseTriggers, loadBase };
