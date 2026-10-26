---
description: fp-yoohoo control: show status or switch mode (status/on/hint/off/test/help)
argument-hint: [status|on|hint|off|test|help]
allowed-tools: Bash(node:*)
---

The line below is the deterministic result of the fp-yoohoo control CLI (the
mode, if changed, is **already applied**, since this ran before you were invoked).
Relay it to the user in one short line. Do not run any other command.

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/cli.js" $ARGUMENTS`
