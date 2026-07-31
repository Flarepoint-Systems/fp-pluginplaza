'use strict';

// Backs the /fp-yoohoo:mode command: set the mode, report status, or test the
// raise for real. Output is deterministic (no model round-trip) — the command
// surfaces this line directly.
//   node cli.js [status | show | on | hint | off | test | help]

const { base, PLUGIN, settings } = require('./yoohoo');
const terminal = require('./terminal');
const focus = require('./focus');

const HELP = [
  'fp-yoohoo control (/fp-yoohoo:mode <arg>):',
  '  status        show the current mode, backend and detected terminal',
  '  on            raise the terminal when Claude waits on you (default)',
  '  hint          bell and desktop notification only, never steal focus',
  '  off           disable; nothing happens when Claude waits',
  '  test          raise the terminal right now, to prove it works',
  '  help          this list',
].join('\n');

function status() {
  const mode = base.mode.get(PLUGIN);
  const host = terminal.find();
  const backends = focus.detect().map((b) => b.name);
  const where = host ? `${host.comm} (pid ${host.pid})` : 'no window found (tmux, ssh or a bare tty)';
  const via = backends.length ? backends[0] : 'fallback (bell + notification)';
  return `fp-yoohoo: ${mode} · terminal: ${where} · via: ${via} · triggers: ${settings().triggers.join(', ')}`;
}

function test() {
  const { outcome, backend, pid } = focus.bringToFront({
    onlyWhenUnfocused: false, // a test that skips itself proves nothing
    alert: { title: 'fp-yoohoo', body: 'this is what a nudge looks like' },
  });
  if (!outcome) return `fp-yoohoo: could not raise anything (backend: ${backend}, pid: ${pid ?? 'unknown'})`;
  return `fp-yoohoo: ${outcome} via ${backend}${pid ? ` (pid ${pid})` : ''}`;
}

function run(arg) {
  const cmd = (arg || 'status').toLowerCase();
  switch (cmd) {
    case 'status':
    case 'show':
      return status();
    case 'on':
    case 'hint':
    case 'off':
      base.mode.set(PLUGIN, cmd);
      return `fp-yoohoo: ${cmd}`;
    case 'test':
      return test();
    case 'help':
      return HELP;
    default:
      return `fp-yoohoo: unknown "${cmd}" (use status|on|hint|off|test|help)`;
  }
}

if (require.main === module) {
  process.stdout.write(`${run(process.argv[2])}\n`);
}

module.exports = { run, status, test };
