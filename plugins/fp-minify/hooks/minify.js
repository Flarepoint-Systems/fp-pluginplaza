'use strict';

// Shared setup for every fp-minify hook: load the (symlinked or dev) base,
// declare the mode levels once, and hold the prior the inject hook pushes at the
// start of each turn while active. The authoritative, expanded version lives in
// skills/fp-minify/SKILL.md; this is the terse injected copy.
//
// fp-minify is an *influential* plugin, like fp-barbeque: its prior shapes what
// the model writes (comment concision) rather than only annotating. But its whole
// footprint is a single inject at the task edge — never a mid-solve interjection,
// and it only ever touches comments, never the code's behavior.

function loadBase() {
  try {
    return require('./_fpbase'); // production: the symlinked base
  } catch {
    return require('@flarepoint/base'); // dev/test fallback
  }
}

const base = loadBase();
const PLUGIN = 'minify';

// off is added automatically. "on" is not a level — the inject/cli map it to the
// default (tidy), the same way fp-honesty maps "on" to "full".
base.mode.define(PLUGIN, { levels: ['new', 'tidy'], default: 'tidy' });

const DOCTRINE = `A comment earns its place only by carrying what the code cannot:
- Why, not what — the reason for something non-obvious or deliberately odd, so a later reader won't "fix" it back.
- Meaning a name can't hold — config values, magic numbers, units, ranges, invariants, constraints.
ONE LINE, HARD. Every comment is a SINGLE self-contained line. This is a cap, not a default: there is no "the reasoning needs the room" exception, and you do not get to judge your way past it. If a why won't fit, split it into separate one-liners anchored at the things they each explain, or keep only the part a reader must have and send the rest to the commit message. Multi-line only when the user explicitly asks for it.
WHAT IS NOT A REASON TO WRITE MORE. The investigation you just ran is what YOU learned, not what the reader needs: measurements, sample counts and percentages, alternatives you rejected and how they failed, what broke last time, the story of how you got here. All of that is the commit message. Give the reader the rule, not the road to it. You will feel this material is essential right after finding it. It isn't.
DENSITY. Most functions need zero comments. If nearly every stanza of a block carries one, they are not earning their place — the bar is per comment AND per block. A stretch of code with no comments is the normal case, not an omission.
Cut or compress anything that restates what the code plainly does, narrates the happy path, or tells a story that belongs in a commit, PR, or ticket.
Exempt: API doc comments — JSDoc/TSDoc, docstrings, godoc — are contracts for callers; keep them, in their normal multi-line shape (the one-line cap is for inline comments). But a doc-position block that is really inline narration still gets trimmed.`;

const CLOSER = `This shapes comments only: it never changes what the code does, and never drops a comment that carries real information. Unsure a comment is earned? Make it short rather than delete it.`;

const RULES = {
  tidy: `fp-minify (tidy) — keep code comments concise. Active while you write or edit code.
${DOCTRINE}
Also tidy comments already inside any block you edit — tighten the over-long, drop the redundant — but never touch comments in code you are not otherwise changing.
${CLOSER}`,

  new: `fp-minify (new) — keep code comments concise. Active while you write code.
${DOCTRINE}
Govern only the comments you write fresh; leave existing comments as they are.
${CLOSER}`,
};

module.exports = { base, PLUGIN, RULES, loadBase };
