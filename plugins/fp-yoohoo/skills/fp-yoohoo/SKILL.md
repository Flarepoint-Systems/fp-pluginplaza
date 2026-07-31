---
name: fp-yoohoo
description: >
  Terminal-recall mode. Reference for fp-yoohoo, the plugin that brings the
  terminal window to the foreground when Claude Code stops and waits on a human:
  a permission prompt, a question dialog, a plan to approve. Explains what it
  hooks, which desktops it can raise a window on, how the already-focused guard
  works, and how to configure or debug it. Use whenever the user says
  "fp-yoohoo", "yoohoo", or asks why the terminal did or did not come to the
  front, why they missed a prompt, or how to change what triggers a raise.
  Levels: off, hint, on (default). Switch by typing "fp-yoohoo on" /
  "fp-yoohoo hint" / "fp-yoohoo off".
license: MIT
---

# fp-yoohoo — the terminal comes to you

fp-yoohoo is the only plugin in the plaza that changes nothing about how you
think or write. It injects no prior, reads no transcript, and tags no claims. It
is pure mechanism, and it does one thing. When Claude Code stops to ask the user
something, the terminal window comes to the front, so a waiting session cannot be
missed and the user never has to remember to check back.

**You have no behavior to follow here.** If this skill loaded, the user is asking
about the plugin, not asking you to act differently. Answer from the reference
below and get out of the way.

## What sets it off

fp-yoohoo subscribes to the `Notification` hook, filtered by notification type.

| Type | Meaning | On by default |
|---|---|---|
| `permission_prompt` | a tool call needs approval | yes |
| `elicitation_dialog` | a question or plan dialog is open | yes |
| `agent_needs_input` | an agent is blocked on the user | yes |
| `idle_prompt` | the prompt has sat idle for 60 seconds | no, opt in |

Turn end (the `Stop` hook) is deliberately not wired up. It fires after every
single reply, which would raise the window dozens of times an hour and teach the
user to ignore it.

## How the raise happens

The hook runs as a grandchild of the terminal emulator, so it walks the parent
chain until it meets one (Konsole, kitty, Alacritty, WezTerm, Ghostty, foot,
Windows Terminal and friends). That pid is what a window gets matched on.

Backends are tried in order, and the first one whose desktop is present wins:

- **KDE Plasma**, Wayland or X11, through a temporary KWin script loaded over
  D-Bus. Wayland forbids a client from raising itself, so the compositor is asked
  to do it instead. No extra packages are needed.
- **Hyprland and sway**, through `hyprctl` or `swaymsg`.
- **X11**, through `wmctrl` or `xdotool`.
- **macOS**, through System Events, fronting the app by its unix id.
- **Windows**, through `SetForegroundWindow`, falling back to flashing the
  taskbar entry when the OS refuses a background focus change.

When none of them applies, or when the session lives inside tmux or ssh where
there is no local window to raise, fp-yoohoo rings the terminal bell and fires a
desktop notification instead.

## The guard

A raise is skipped when the terminal already has focus. This is what keeps the
plugin from yanking the user around while they are already sitting in the
terminal watching Claude work. It is on by default and can be turned off with
`only_when_unfocused`.

## Modes

- `on` (default): raise the window, subject to the guard.
- `hint`: never steal focus. Ring the bell and post a desktop notification only.
- `off`: do nothing.

## Configuration

Settings live under the `yoohoo` key, in `~/.config/flarepoint/config.json`
globally or `.flarepoint/config.json` per project, and every one of them can be
overridden by an environment variable.

| Key | Default | Meaning |
|---|---|---|
| `mode` | `on` | `on`, `hint` or `off` |
| `triggers` | the three types above | which notification types raise the window |
| `only_when_unfocused` | `true` | skip the raise when the terminal is already focused |
| `cooldown_ms` | `1000` | collapse a burst of prompts into a single raise |

```json
{
  "yoohoo": {
    "triggers": ["permission_prompt", "elicitation_dialog", "agent_needs_input", "idle_prompt"],
    "cooldown_ms": 2000
  }
}
```

Environment overrides follow the shared pattern, so
`FLAREPOINT_YOOHOO_TRIGGERS=permission_prompt` or
`FLAREPOINT_YOOHOO_COOLDOWN_MS=5000` work for a single session.

## Debugging it

`/fp-yoohoo:mode status` reports the mode, the terminal it found, the backend it
would use and the active triggers. `/fp-yoohoo:mode test` performs a real raise
right now, with the focus guard disabled so the result is visible either way.

Two failures are worth knowing about. A terminal that serves every window from
one daemon process (GNOME Terminal is the common case) gives every window the
same pid, so the wrong window can come forward. And inside tmux or over ssh the
parent chain never reaches a window at all, which is why the bell and the
notification exist.
