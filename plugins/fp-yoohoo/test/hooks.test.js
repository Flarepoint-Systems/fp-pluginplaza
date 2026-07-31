'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const notify = require('../hooks/notify');
const cli = require('../hooks/cli');
const statusline = require('../hooks/statusline');
const terminal = require('../hooks/terminal');
const focus = require('../hooks/focus');
const kde = require('../hooks/focus/kde');
const wlroots = require('../hooks/focus/wlroots');
const { base, PLUGIN, settings, parseTriggers } = require('../hooks/yoohoo');

// Isolated config home + project cwd (with a .git marker so the project root
// anchors here). cli/statusline read mode from cwd, so we chdir.
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fpyoo-'));
  const project = path.join(root, 'project');
  fs.mkdirSync(path.join(project, '.git'), { recursive: true });
  process.env.FLAREPOINT_CONFIG_HOME = path.join(root, 'global');
  const prev = process.cwd();
  process.chdir(project);
  return { cleanup() { process.chdir(prev); fs.rmSync(root, { recursive: true, force: true }); } };
}

test('decide acts on the default triggers and stays out of everything else', () => {
  const cfg = settings();
  assert.equal(notify.decide({ notification_type: 'permission_prompt' }, 'on', cfg).act, true);
  assert.equal(notify.decide({ notification_type: 'elicitation_dialog' }, 'on', cfg).act, true);
  assert.equal(notify.decide({ notification_type: 'agent_needs_input' }, 'on', cfg).act, true);

  // registered in hooks.json but opt-in, so it must not fire by default
  assert.equal(notify.decide({ notification_type: 'idle_prompt' }, 'on', cfg).act, false);
  assert.equal(notify.decide({ notification_type: 'auth_success' }, 'on', cfg).act, false);
});

test('off means off, whatever the notification', () => {
  const cfg = settings();
  const verdict = notify.decide({ notification_type: 'permission_prompt' }, 'off', cfg);
  assert.equal(verdict.act, false);
  assert.equal(verdict.reason, 'off');
});

test('an unrecognised payload shape still acts, since the matcher already gated it', () => {
  assert.equal(notify.decide({}, 'on', settings()).act, true);
  assert.equal(notify.typeOf({ notificationType: 'permission_prompt' }), 'permission_prompt');
  assert.equal(notify.typeOf({ type: 'idle_prompt' }), 'idle_prompt');
  assert.equal(notify.typeOf({}), '');
});

test('triggers parse from an array, a comma list, or nothing at all', () => {
  assert.deepEqual(parseTriggers(['a', 'b']), ['a', 'b']);
  assert.deepEqual(parseTriggers('a, b ,c'), ['a', 'b', 'c']);
  assert.deepEqual(parseTriggers(undefined).length, 3);
});

test('config overrides reach settings()', (t) => {
  const sb = sandbox();
  t.after(() => { delete process.env.FLAREPOINT_YOOHOO_TRIGGERS; sb.cleanup(); });
  process.env.FLAREPOINT_YOOHOO_TRIGGERS = 'idle_prompt';
  const cfg = settings();
  assert.deepEqual(cfg.triggers, ['idle_prompt']);
  assert.equal(notify.decide({ notification_type: 'permission_prompt' }, 'on', cfg).act, false);
  assert.equal(notify.decide({ notification_type: 'idle_prompt' }, 'on', cfg).act, true);
});

test('the cooldown collapses a burst into one raise', (t) => {
  const sb = sandbox();
  const session = `t${process.pid}`;
  t.after(() => { fs.rmSync(notify.stampFile(session), { force: true }); sb.cleanup(); });

  const t0 = 1_000_000;
  assert.equal(notify.cooledDown(session, 1000, t0), true);
  assert.equal(notify.cooledDown(session, 1000, t0 + 200), false);
  assert.equal(notify.cooledDown(session, 1000, t0 + 1200), true);
  assert.equal(notify.cooledDown(session, 0, t0 + 1201), true); // disabled cooldown never blocks
});

test('the terminal walk finds a real ancestor here and refuses multiplexers', () => {
  assert.equal(terminal.isTerminal('konsole'), true);
  assert.equal(terminal.isTerminal('Konsole'), true);
  assert.equal(terminal.isTerminal('bash'), false);
  assert.equal(terminal.parentOf(process.pid) > 0, true);
  // node's own comm is not a terminal, so a zero-depth walk must find nothing
  assert.equal(terminal.find(process.pid, { maxDepth: 1 }), null);
});

test('every backend exposes the same shape and survives being probed', () => {
  for (const backend of focus.BACKENDS) {
    assert.equal(typeof backend.name, 'string');
    assert.equal(typeof backend.available(), 'boolean');
    assert.equal(typeof backend.raise, 'function');
  }
  assert.equal(Array.isArray(focus.detect()), true);
});

test('the kwin script targets the pid and honours the focus guard', () => {
  const guarded = kde.script(4242, true);
  assert.match(guarded, /var TARGET = 4242;/);
  assert.match(guarded, /activeWindow/);
  assert.match(guarded, /clientList/); // plasma 5 fallback
  assert.match(guarded, /if \(!\(true && active && active\.pid === TARGET\)\)/);
  assert.match(kde.script(1, false), /if \(!\(false && active/);
});

test('the sway tree flattens through nested and floating nodes', () => {
  const tree = { id: 1, nodes: [{ id: 2, nodes: [{ id: 3, pid: 99 }] }], floating_nodes: [{ id: 4, pid: 7 }] };
  const ids = wlroots.swayNodes(tree).map((n) => n.id);
  assert.deepEqual(ids.sort(), [1, 2, 3, 4]);
});

test('cli switches modes and reports a status line', (t) => {
  const sb = sandbox();
  t.after(sb.cleanup);

  assert.equal(cli.run('hint'), 'fp-yoohoo: hint');
  assert.equal(base.mode.get(PLUGIN), 'hint');
  assert.equal(cli.run('off'), 'fp-yoohoo: off');
  assert.equal(base.mode.get(PLUGIN), 'off');
  assert.equal(cli.run('on'), 'fp-yoohoo: on');

  assert.match(cli.run('status'), /^fp-yoohoo: on · terminal: .+ · via: .+ · triggers: /);
  assert.match(cli.run(), /^fp-yoohoo: on/); // status is the default
  assert.match(cli.run('help'), /raise the terminal when Claude waits/);
  assert.match(cli.run('nonsense'), /unknown "nonsense"/);
});

test('statusline is opt-in and reflects the mode', (t) => {
  const sb = sandbox();
  t.after(sb.cleanup);

  assert.equal(statusline.segment().active, true);
  assert.equal(statusline.segment().value, 'on');
  base.config.set('statusline', 'enabled', true);
  assert.equal(base.statusline.render([statusline.segment()], { enabled: true }), 'fp · yoohoo:on');
  assert.equal(base.statusline.render([statusline.segment()], { enabled: false }), '');

  cli.run('off');
  assert.equal(statusline.segment().active, false);
});
