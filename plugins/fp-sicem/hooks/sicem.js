'use strict';

// Shared setup for every fp-sicem hook: load the base, declare the mode levels,
// and hold the two texts the hooks inject. RULES is the full prior, sent at
// session start and whenever the mode changes. REMINDERS is the one-line nudge
// sent on every other prompt. skills/fp-sicem/SKILL.md is the expanded version.

function loadBase() {
  try {
    return require('./_fpbase'); // production: the symlinked base
  } catch {
    return require('@flarepoint/base'); // dev/test fallback
  }
}

const base = loadBase();
const PLUGIN = 'sicem';

base.mode.define(PLUGIN, { levels: ['on'], default: 'on' });

const RULES = {
  on: `fp-sicem is on: readable prose. It applies while you write or revise prose artifacts: READMEs, docs, markdown files, and the bodies of PRs and commits. It does not apply to your chat replies, your code, or your code comments (those are fp-minify's job).
The goal is prose that any English reader can follow at speed, non-native readers included, without lowering the vocabulary. Clearer and cleaner, not simpler.
Write without em-dashes. Use the connector that fits instead: a period between two full thoughts, a comma for a light aside, parentheses for a true aside, a colon only before a real list or definition, or a plain "so", "but" or "and" for the logical link. Keep an em-dash only in the rare spot where nothing else carries the meaning. Treat its cousins the same way, because they trip the same readers: the semicolon, the colon used for drama, and the long dash-parenthetical.
Where it reads naturally, prefer shorter sentences and fewer nested clauses. This is a gentle preference, so never restructure an argument or flatten nuance to get there.
This changes style only. It never changes the meaning, the facts or the level of vocabulary.`,
};

const REMINDERS = {
  on: `fp-sicem is on. In prose artifacts (docs, READMEs, markdown, PR and commit bodies), write without em-dashes or semicolons and use a period, comma, parentheses, or "so", "but" or "and" instead. Chat replies, code and comments are out of scope.`,
};

module.exports = { base, PLUGIN, RULES, REMINDERS, loadBase };
