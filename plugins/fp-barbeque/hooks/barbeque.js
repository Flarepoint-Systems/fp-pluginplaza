'use strict';

// Shared setup for every fp-barbeque hook: load the base, declare the mode levels,
// and hold the two texts the hooks inject. RULES is the full prior, sent at
// session start and whenever the mode changes. REMINDERS is the one-line nudge
// sent on every other prompt. skills/fp-barbeque/SKILL.md is the expanded version.

function loadBase() {
  try {
    return require('./_fpbase'); // production: bundled into the plugin
  } catch {
    return require('@flarepoint/base'); // dev/test: the file: devDependency
  }
}

const base = loadBase();
const PLUGIN = 'barbeque';

base.mode.define(PLUGIN, { levels: ['on'], default: 'on' });

const RULES = {
  on: `fp-barbeque is on: understanding-first mode.
Before you implement an exploratory task (a refactor, a design or architecture decision, a feature with fuzzy scope, or anything with more than one reasonable approach), build a shared understanding with the user first. The goal is that they can debug and own the result, not only that you feel confident.
1. Read first. Look at the relevant code and context before you ask anything, so every question is grounded in what is actually there. Don't ask what you could find out by reading.
2. Ask through the AskUserQuestion option-dialog rather than open questions in prose. Offer the real forks, tradeoffs and assumptions as choices the user can confirm or correct. State the scope: what is in, what is out, and which files or areas you will touch.
3. Recap, then build. When understanding is mutual, state the agreed scope in one short recap and proceed. If the user pushes back on the recap, keep talking.
Skip all of this for trivial, mechanical or fully specified work, and for follow-ups inside a scope you already agreed. In those cases, just build. Keep it brief: one round of questions is usually enough.`,
};

const REMINDERS = {
  on: `fp-barbeque is on. For a new exploratory task: read first, settle the real forks through the option-dialog, recap, then build. Trivial, fully specified or already-agreed work: just build.`,
};

module.exports = { base, PLUGIN, RULES, REMINDERS, loadBase };
