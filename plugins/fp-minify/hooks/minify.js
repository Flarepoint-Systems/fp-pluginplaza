'use strict';

// Shared setup for every fp-minify hook: load the base, declare the mode levels,
// and hold the two texts the hooks inject. RULES is the full prior, sent at
// session start and whenever the mode changes. REMINDERS is the one-line nudge
// sent on every other prompt. skills/fp-minify/SKILL.md is the expanded version.

function loadBase() {
  try {
    return require('./_fpbase'); // production: the symlinked base
  } catch {
    return require('@flarepoint/base'); // dev/test fallback
  }
}

const base = loadBase();
const PLUGIN = 'minify';

// "on" is not a level: inject and cli map it to tidy, as fp-honesty maps it to full.
base.mode.define(PLUGIN, { levels: ['new', 'tidy'], default: 'tidy' });

const DOCTRINE = `A comment earns its place by carrying something the code cannot:
- Why, not what. The reason behind something non-obvious or deliberately odd, so a later reader won't "fix" it back.
- Meaning a name can't hold. Config values, magic numbers, units, ranges, invariants, constraints.
Keep each comment to a single self-contained line. This is a firm cap, not a default to reason your way past. If a why won't fit, split it into one-liners anchored at the things they explain, or keep only what the reader needs and move the rest to the commit message. Write multi-line comments only when the user asks for them.
The investigation is not the comment. Measurements, sample counts, alternatives you rejected, what broke last time and how you got here are what you learned, not what the reader needs, so they belong in the commit message. Right after you find them they will feel essential. They aren't.
Watch density too. Most functions need no comments at all. If nearly every stanza of a block has one, they aren't earning their place, however short each is. Uncommented code is the normal case, not an omission.
Cut or shorten anything that restates the code, narrates the happy path, or tells a story that belongs in a commit, PR or ticket.
API doc comments (JSDoc/TSDoc, docstrings, godoc) are exempt. They are contracts for callers and keep their normal multi-line shape. A doc-position block that is really inline narration still gets trimmed.`;

const CLOSER = `This shapes comments only. It never changes what the code does, and never drops a comment that carries real information. If you're unsure whether a comment is earned, shorten it rather than delete it.`;

const RULES = {
  tidy: `fp-minify (tidy) is on: keep code comments concise while you write or edit code.
${DOCTRINE}
Also tidy the comments inside any block you edit (tighten the long ones, drop the redundant ones), but leave comments alone in code you aren't otherwise changing.
${CLOSER}`,

  new: `fp-minify (new) is on: keep code comments concise while you write code.
${DOCTRINE}
Apply this only to comments you write fresh, and leave existing comments as they are.
${CLOSER}`,
};

const REMINDERS = {
  tidy: `fp-minify (tidy) is on. A comment carries only a why or meaning a name can't hold, one line each, and most functions need none. Tidy the comments in blocks you edit. Docstrings are exempt.`,
  new: `fp-minify (new) is on. A comment you write carries only a why or meaning a name can't hold, one line each, and most functions need none. Leave existing comments alone. Docstrings are exempt.`,
};

module.exports = { base, PLUGIN, RULES, REMINDERS, loadBase };
