'use strict';

// Assembles the context block a plugin hook injects, at the current mode. One
// consistent, clearly-marked envelope for every plugin, so the host (and a
// curious user) can always see what fp added.
//
// Pieces a plugin may pass:
//   rules      the text for this mode: the full prior, or a one-line reminder
//   suggestion at most one extra line (e.g. fp-honesty's backstop disclosure)
//   note       a mode-change confirmation, shown even when the mode is off
//
// Returns '' when there is nothing to inject, so an inactive plugin stays silent.

const MARKER = 'fp';

function build(plugin, { mode = 'on', rules = '', suggestion = null, note = null } = {}) {
  const sections = [];
  if (note) sections.push(String(note).trim());
  if (mode !== 'off' && rules) sections.push(rules.trim());
  if (suggestion) {
    const line = typeof suggestion === 'string' ? suggestion : suggestion.line;
    if (line) sections.push(line.trim());
  }
  if (sections.length === 0) return '';
  const open = `<${MARKER}:${plugin} mode=${mode}>`;
  const close = `</${MARKER}:${plugin}>`;
  return `${open}\n${sections.join('\n\n')}\n${close}`;
}

module.exports = { MARKER, build };
