---
name: fp-minify
description: >
  Comment-concision mode. Shapes the code the model writes so comments earn their
  place (a non-obvious why, or meaning a name can't hold: config, units, magic
  numbers, constraints) and stay short. Hard one-line cap on inline comments, and
  a density bar, so most functions carry none. Measurements, rejected
  alternatives, and the debugging story go to the commit message, not the code.
  API doc comments (JSDoc/TSDoc, docstrings, godoc) are exempt. Sets a prior at
  the task edge, never steers mid-solve, and only ever touches comments, never
  the code's behavior. Use
  whenever the user says "fp-minify", "fewer comments", "over-commented", "trim the
  comments", or asks for more concise commenting. Modes: off, new, tidy (default).
  Switch by typing "fp-minify new" / "fp-minify tidy" / "fp-minify off". Bulk
  cleanup on demand: /fp-minify:strip.
license: MIT
---

# fp-minify

Model-written code is often excellent but **over-commented** — inline essays that
restate what the code plainly does, or paragraph-long backstories that belong in a
commit message. fp-minify sets a prior so comments **earn their place**: it keeps
the ones that carry real information and cuts or compresses the rest, without ever
changing what the code does.

## Persistence

ACTIVE while on. Default: **tidy** — installing the plugin is the opt-in to
concise comments. Off via `/fp-minify:mode off` or "stop fp-minify". Switch by
typing `fp-minify new` / `fp-minify tidy` / `fp-minify off` (the plugin's hook
applies it instantly, before the model replies).

## When a comment earns its place

A comment is justified **only when it carries what the code cannot**. Two cases:

- **Why, not what.** The reason for something non-obvious, surprising, or
  deliberately odd — so a later reader doesn't "fix" it back. The code already
  says *what* it does; a comment that restates that is noise.
- **Meaning a name can't hold.** Config values, magic numbers, units, ranges,
  invariants, constraints — where the identifier alone can't tell you what's
  legal or why this number.

## One line, hard

An earned comment is **a single self-contained line**. Not "one line by default",
not "one line unless the reasoning needs room". A cap, with no judgment call to
negotiate past.

The hardness is the point, so don't soften it back into a default. A rule that
allows expansion "when the reasoning truly needs the room" never binds, because
the model writes the comment minutes after working the problem out and always
believes the room is needed. A subjective ceiling is no ceiling.

When a why won't fit on one line, you have two moves and neither is a paragraph:

1. **Split it.** Anchor a one-liner at each thing it actually explains, rather
   than one block at the top explaining four of them.
2. **Cut to what the reader must have**, and send the rest to the commit message.

Multi-line comments happen only when you explicitly ask for one.

## What is not a reason to write more

The most convincing bloat is the investigation you just finished. It feels
essential because you paid for it, but it is what *you* learned, not what the
reader needs. None of the following earns extra lines:

- Measurements, sample counts, percentages, timing runs.
- Alternatives you rejected and the story of how each one failed.
- What broke last time, or in the other module.
- The shape of the debugging session that produced the code.

That material is real and worth keeping. It belongs in the **commit message**,
where it stays findable without sitting on top of the code forever. The comment
gets the rule. The commit gets the road to it.

## Density

Length is one axis, count is the other. **Most functions need zero comments.** If
nearly every stanza in a block carries one, they are not earning their place no
matter how short each one is. A stretch of uncommented code is the normal case,
not an omission.

## What gets cut or compressed

- Comments that restate what the code plainly does.
- Narration of the happy path ("now we loop over the items and return them").
- A story that belongs in a commit, PR, or ticket rather than the source.
- An earned-but-bloated comment, kept but compressed to its essential line.

**Exempt:** API doc comments (JSDoc/TSDoc, Python docstrings, godoc) are
contracts for callers, not the target. Keep them, in their normal multi-line
shape. The one-line cap governs inline comments. But a doc-*position* block that
is really inline narration (a paragraph essay above a function) still gets
trimmed, because sitting in doc position doesn't make prose a contract.

## Modes

- **off** — silent; comment as usual.
- **new** — govern only the comments the model writes fresh; leave existing
  comments untouched.
- **tidy** *(default)* — as `new`, and also tighten over-long or redundant
  comments **already inside a block the model is editing**. It never touches
  comments in code it isn't otherwise changing — no drive-by rewrites.

## Bulk stripping — `/fp-minify:strip`

The modes above are the always-on prior. When you want a **deliberate cleanup
pass**, run `/fp-minify:strip [target]` — it walks the target (a file, a dir, or
the current focus) and removes or compresses unearned comments by the same rules.
Because it's a bulk edit, it shows you what it will remove before deleting a lot
at once, and shortens rather than drops when a comment's value is unclear.

## What this is not

- **Not a gate.** It doesn't block edits or commits. It sets a prior; the model
  honors it.
- **Not a code rewriter.** It changes **comments only** — never behavior — and
  never removes a comment that carries real information. Unsure a comment is
  earned? Shorten it, don't delete it.
- **Not mid-solve steering.** It fires once, at the task edge, like the rest of
  the plaza.

## Boundaries

fp-minify governs comment concision, nothing else. "stop fp-minify" / "off":
comment as usual. The mode persists until changed or session end.
