'use strict';

// SessionStart hook (startup, resume, clear, compact): send the full prior and
// mark this session primed, so later prompts only need the one-line reminder.
// Compaction drops the earlier prior from context, which is why it re-fires there.

const { base, PLUGIN, RULES } = require('./sicem');

function buildPrime(mode, sessionId) {
  if (mode === 'off') return '';
  base.primed.set(PLUGIN, sessionId, mode);
  return base.inject.build(PLUGIN, { mode, rules: RULES[mode] || '' });
}

function run() {
  try {
    const out = buildPrime(base.mode.get(PLUGIN), base.util.readHookInput().session_id);
    if (out) process.stdout.write(out);
  } catch {
    // Priming is best-effort; never block a session.
  }
}

if (require.main === module) run();

module.exports = { buildPrime, run };
