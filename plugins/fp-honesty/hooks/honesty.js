'use strict';

// Shared setup for every fp-honesty hook: load the base, declare the mode levels,
// and hold the two texts the hooks inject. RULES is the full prior, sent at
// session start and whenever the mode changes. REMINDERS is the one-line nudge
// sent on every other prompt. skills/fp-honesty/SKILL.md is the expanded version.

const os = require('os');
const path = require('path');
const crypto = require('crypto');

function loadBase() {
  try {
    return require('./_fpbase'); // production: bundled into the plugin
  } catch {
    return require('@flarepoint/base'); // dev/test: the file: devDependency
  }
}

const base = loadBase();
const PLUGIN = 'honesty';

// Cross-turn backstop flag, kept OUT of the user's repo. It once lived in
// <repo>/.flarepoint and got accidentally committed; a per-project file under
// the OS temp dir avoids the working tree entirely. One-turn signal, so losing
// it on reboot is harmless.
function flagFile(start) {
  const root = base.config.paths(start).projectRoot;
  const key = crypto.createHash('sha256').update(root).digest('hex').slice(0, 16);
  return path.join(os.tmpdir(), 'flarepoint-honesty', `${key}-audit-flag.json`);
}

base.mode.define(PLUGIN, { levels: ['footer', 'full'], default: 'full' });

const COMMON = `Tag the basis of each load-bearing factual claim, meaning a claim that would cost the user if it were wrong: facts about this codebase, how an API or library behaves, versions and limits, "X is unused, safe or already handled", or facts about the outside world.
Use these exact tags, emoji included:
- [🟢 verified] you confirmed it with a tool in this turn. A check from an earlier turn, or being fairly sure, does not count.
- [🟡 inferred] your own reasoning, unchecked.
- [🟠 recalled] training knowledge, which may be stale.
- [🔴 guess] a hunch.
Leave opinions, plans, questions and the code you write untagged (code is the artifact, not a claim), and keep ordinary prose clean.
Non-interference: the tags only report. They never change what you do, so don't add caveats, fallbacks, hedging or extra caution because a claim is only inferred.`;

const RULES = {
  full: `fp-honesty (full) is on for this response.
${COMMON}
Put the tag right after each claim it applies to, then end the response with one footer line: "basis: 🟢 N verified · 🟡 M inferred · …", listing only the levels you used, each with its emoji. A response with no load-bearing claims gets no footer.`,
  footer: `fp-honesty (footer) is on for this response.
${COMMON}
Don't put tags inline. Instead, end the response with one footer line that tallies the basis of the load-bearing claims you made: "basis: 🟢 N verified · 🟡 M inferred · …", each level with its emoji. A response with no load-bearing claims gets no footer.`,
};

const REMINDERS = {
  full: `fp-honesty (full) is on. Tag each load-bearing claim inline with [🟢 verified] (tool-checked this turn), [🟡 inferred], [🟠 recalled] or [🔴 guess], and end with the "basis:" footer. The tags never change what you do.`,
  footer: `fp-honesty (footer) is on. No inline tags. End with the "basis:" footer tallying your load-bearing claims by level. The tags never change what you do.`,
};

module.exports = { base, PLUGIN, RULES, REMINDERS, loadBase, flagFile };
