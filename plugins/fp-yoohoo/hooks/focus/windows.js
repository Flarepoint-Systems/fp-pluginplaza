'use strict';

// Windows. SetForegroundWindow is refused unless the calling process owns the
// foreground or input state, which a hook never does, so a refusal falls back to
// FlashWindowEx: the OS-sanctioned way to demand attention from the background.

const { run } = require('./exec');

function available() {
  return process.platform === 'win32';
}

const PS = `
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class FpYoohoo {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool FlashWindow(IntPtr h, bool invert);
  [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr h, out int pid);
}
"@
$target = __PID__
$guard = __GUARD__
# The pane process may be windowless (Windows Terminal), so climb to an ancestor that owns a window.
$handle = [IntPtr]::Zero
$walk = $target
for ($i = 0; $i -lt 8 -and $walk -gt 0 -and $handle -eq [IntPtr]::Zero; $i++) {
  $p = Get-Process -Id $walk -ErrorAction SilentlyContinue
  if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) { $handle = $p.MainWindowHandle; break }
  $walk = (Get-CimInstance Win32_Process -Filter "ProcessId = $walk" -ErrorAction SilentlyContinue).ParentProcessId
}
if ($handle -eq [IntPtr]::Zero) { Write-Output 'nowindow'; exit 0 }
if ($guard) {
  $fg = [FpYoohoo]::GetForegroundWindow()
  $fgPid = 0; [void][FpYoohoo]::GetWindowThreadProcessId($fg, [ref]$fgPid)
  if ($fg -eq $handle) { Write-Output 'skipped'; exit 0 }
}
[void][FpYoohoo]::ShowWindow($handle, 9)
if ([FpYoohoo]::SetForegroundWindow($handle)) { Write-Output 'raised' }
else { [void][FpYoohoo]::FlashWindow($handle, $true); Write-Output 'flashed' }
`;

function raise(pid, { onlyWhenUnfocused = true } = {}) {
  const source = PS.replace('__PID__', String(pid)).replace('__GUARD__', onlyWhenUnfocused ? '$true' : '$false');
  const out = run('powershell', ['-NoProfile', '-NonInteractive', '-Command', source]);
  if (out === null) return null;
  return out.trim() || 'raised';
}

module.exports = { name: 'windows', available, raise };
