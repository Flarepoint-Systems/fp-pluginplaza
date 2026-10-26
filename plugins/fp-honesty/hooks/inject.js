'use strict';

// UserPromptSubmit hook. Two jobs each prompt:
//   1. If the prompt is a mode directive ("fp-honesty off", "stop fp-honesty"),
//      flip the saved mode here, before the model replies, so no tool call is needed.
//   2. Inject the prior: the full text if this session hasn't been primed at the
//      current mode yet (see prime.js), otherwise the one-line reminder.
// Output goes to stdout, which Claude Code adds to the prompt context.

const { base, PLUGIN, RULES, REMINDERS, flagFile } = require('./honesty');
const fs = require('fs');

// Matches an explicit directive at the START of the prompt, so a passing mention
// of "fp-honesty" mid-sentence never flips the mode. The "/", "@" or "$" prefix
// is optional, and ":fp-honesty" (the plugin:skill form) is allowed.
const DIRECTIVE = /^\s*[/@$]?fp-honesty(?::fp-honesty)?\s+(off|on|full|footer|show)\b/i;

function detectDirective(prompt) {
  const m = DIRECTIVE.exec(prompt || '');
  if (m) return m[1].toLowerCase();
  if (/\bstop fp-honesty\b/i.test(prompt || '')) return 'off';
  return null;
}

// Pure apart from the primed marker, so tests don't touch stdin/stdout.
function buildContext(mode, { suggestion = null, note = null, sessionId = '' } = {}) {
  const rules = base.primed.pick(PLUGIN, sessionId, mode, { full: RULES[mode], reminder: REMINDERS[mode] });
  return base.inject.build(PLUGIN, { mode, rules, suggestion, note });
}

function takeDisclosure() {
  const file = flagFile();
  const data = base.util.readJSON(file, null);
  if (!data) return null;
  fs.rmSync(file, { force: true });
  return data.disclosure || null;
}

// Apply a directive and return a one-line note for the model, or null.
function applyDirective(directive) {
  if (!directive) return null;
  if (directive === 'show') {
    return `fp-honesty mode is currently "${base.mode.get(PLUGIN)}". Tell the user in one short line; do not run anything.`;
  }
  const target = directive === 'on' ? 'full' : directive;
  base.mode.set(PLUGIN, target);
  return `fp-honesty switched to "${target}" (already applied). Confirm to the user in one short line; do not run any command.`;
}

function run() {
  try {
    const input = base.util.readHookInput();
    const note = applyDirective(detectDirective(input.prompt));
    const mode = base.mode.get(PLUGIN);
    const out = buildContext(mode, { suggestion: takeDisclosure(), note, sessionId: input.session_id });
    if (out) process.stdout.write(out);
  } catch {
    // Injection is best-effort; never block a prompt.
  }
}

if (require.main === module) run();

module.exports = { buildContext, detectDirective, applyDirective, run, flagFile };
