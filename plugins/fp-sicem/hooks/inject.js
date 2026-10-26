'use strict';

// UserPromptSubmit hook. Two jobs each prompt:
//   1. If the prompt is a mode directive ("fp-sicem off", "stop fp-sicem"), flip the
//      saved mode here, before the model replies, so switching needs no tool call.
//   2. Inject the prior: the full text if this session hasn't been primed at the
//      current mode yet (see prime.js), otherwise the one-line reminder.
// Output goes to stdout, which Claude Code adds to the prompt context.

const { base, PLUGIN, RULES, REMINDERS } = require('./sicem');

// Matches an explicit directive at the START of the prompt, so a passing mention
// of "fp-sicem" mid-sentence never flips the mode. The "/", "@" or "$" prefix is
// optional, and ":fp-sicem" (the plugin:skill form) is allowed.
const DIRECTIVE = /^\s*[/@$]?fp-sicem(?::fp-sicem)?\s+(off|on|show)\b/i;

function detectDirective(prompt) {
  const m = DIRECTIVE.exec(prompt || '');
  if (m) return m[1].toLowerCase();
  if (/\bstop fp-sicem\b/i.test(prompt || '')) return 'off';
  return null;
}

// Pure apart from the primed marker, so tests don't touch stdin/stdout.
function buildContext(mode, { note = null, sessionId = '' } = {}) {
  const rules = base.primed.pick(PLUGIN, sessionId, mode, { full: RULES[mode], reminder: REMINDERS[mode] });
  return base.inject.build(PLUGIN, { mode, rules, note });
}

// Apply a directive and return a one-line note for the model, or null.
function applyDirective(directive) {
  if (!directive) return null;
  if (directive === 'show') {
    return `fp-sicem mode is currently "${base.mode.get(PLUGIN)}". Tell the user in one short line; do not run anything.`;
  }
  base.mode.set(PLUGIN, directive);
  return `fp-sicem switched to "${directive}" (already applied). Confirm to the user in one short line; do not run any command.`;
}

function run() {
  try {
    const input = base.util.readHookInput();
    const note = applyDirective(detectDirective(input.prompt));
    const mode = base.mode.get(PLUGIN);
    const out = buildContext(mode, { note, sessionId: input.session_id });
    if (out) process.stdout.write(out);
  } catch {
    // Injection is best-effort; never block a prompt.
  }
}

if (require.main === module) run();

module.exports = { buildContext, detectDirective, applyDirective, run };
