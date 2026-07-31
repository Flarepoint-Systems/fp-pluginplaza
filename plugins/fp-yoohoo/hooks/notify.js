'use strict';

// Notification hook. hooks.json subscribes to the notification types that mean a
// human is being waited on; this decides whether to act on one and, if so, puts
// the terminal back in front of that human.
//
// Writes nothing to stdout: Notification hooks are side-effect only, and a
// waiting prompt is no place to be adding context.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { base, PLUGIN, settings } = require('./yoohoo');
const focus = require('./focus');

const TITLES = {
  permission_prompt: 'Claude Code needs permission',
  elicitation_dialog: 'Claude Code is asking you something',
  agent_needs_input: 'Claude Code needs your input',
  idle_prompt: 'Claude Code is waiting',
};

function readPayload() {
  try {
    const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, ''); // strip BOM some shells add
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

// The payload field naming has moved around across versions, and the matcher in
// hooks.json has already gated us, so an unrecognised shape means "act".
function typeOf(payload) {
  return payload.notification_type || payload.notificationType || payload.type || '';
}

function stampFile(sessionId) {
  const who = typeof os.userInfo === 'function' ? os.userInfo().uid : 0;
  return path.join(os.tmpdir(), `fp-yoohoo-${who}-${sessionId || 'default'}.stamp`);
}

// A denied tool can produce several prompts in a second; one raise is enough.
function cooledDown(sessionId, cooldownMs, now = Date.now()) {
  if (!cooldownMs) return true;
  const file = stampFile(sessionId);
  try {
    const last = Number(fs.readFileSync(file, 'utf8'));
    if (Number.isFinite(last) && now - last < cooldownMs) return false;
  } catch {
    // no stamp yet
  }
  try {
    fs.writeFileSync(file, String(now));
  } catch {
    // a read-only tmp is not a reason to skip the raise
  }
  return true;
}

function decide(payload, mode, cfg) {
  if (mode === base.mode.OFF) return { act: false, reason: 'off' };
  const type = typeOf(payload);
  if (type && !cfg.triggers.includes(type)) return { act: false, reason: 'untriggered' };
  return { act: true, type };
}

function run() {
  try {
    const payload = readPayload();
    const mode = base.mode.get(PLUGIN);
    const cfg = settings();
    const verdict = decide(payload, mode, cfg);
    if (!verdict.act) return;
    if (!cooledDown(payload.session_id, cfg.cooldownMs)) return;

    const alert = {
      title: TITLES[verdict.type] || 'Claude Code',
      body: payload.message || 'is waiting for you',
    };
    if (mode === 'hint') {
      focus.fallback.alert(alert);
      return;
    }
    focus.bringToFront({ onlyWhenUnfocused: cfg.onlyWhenUnfocused, alert });
  } catch {
    // Never let a failed raise disturb the session it was meant to serve.
  }
}

if (require.main === module) run();

module.exports = { decide, typeOf, cooledDown, stampFile, TITLES, run };
