'use strict';

// Repo-wide invariants that no single plugin's suite can see.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PLUGINS = fs.readdirSync(path.join(ROOT, 'plugins'));
const BASE_REF = process.env.FP_BASE_REF || 'origin/main';

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function hasRef(ref) {
  try {
    git('rev-parse', '--verify', '--quiet', ref);
    return true;
  } catch {
    return false;
  }
}

// Files a user's install would pick up: the plugin itself plus the symlinked base, minus tests.
function shippedChanges(plugin) {
  const scope = [`plugins/${plugin}`, 'shared/fpbase/src'];
  const changed = git('diff', '--name-only', BASE_REF, '--', ...scope).split('\n');
  const added = git('ls-files', '--others', '--exclude-standard', '--', ...scope).split('\n');
  return [...changed, ...added].filter((f) => f && !f.includes('/test/'));
}

function versionAt(ref, plugin) {
  const file = `plugins/${plugin}/.claude-plugin/plugin.json`;
  const raw = ref ? git('show', `${ref}:${file}`) : fs.readFileSync(path.join(ROOT, file), 'utf8');
  return JSON.parse(raw).version;
}

// Claude Code caches installs by version, so an unbumped change never reaches existing users.
test('every plugin whose shipped files changed has a bumped version', (t) => {
  if (!hasRef(BASE_REF)) return t.skip(`${BASE_REF} not available`);
  for (const plugin of PLUGINS) {
    let before;
    try {
      before = versionAt(BASE_REF, plugin);
    } catch {
      continue; // new plugin, nothing to compare against
    }
    const changes = shippedChanges(plugin);
    if (changes.length === 0) continue;
    assert.notEqual(
      versionAt(null, plugin),
      before,
      `${plugin} changed since ${BASE_REF} (${changes.slice(0, 3).join(', ')}) but is still ${before}`,
    );
  }
});

test('marketplace lists every plugin directory', () => {
  const market = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.deepEqual(market.plugins.map((p) => p.name).sort(), [...PLUGINS].sort());
});

// The model mirrors its prompt's style, so a prior full of em-dashes undercuts fp-sicem.
test('no injected prior or reminder contains an em-dash', () => {
  for (const plugin of PLUGINS) {
    const file = path.join(ROOT, 'plugins', plugin, 'hooks', `${plugin.replace(/^fp-/, '')}.js`);
    if (!fs.existsSync(file)) continue;
    const { RULES = {}, REMINDERS = {} } = require(file);
    for (const [mode, text] of Object.entries({ ...RULES, ...REMINDERS })) {
      assert.ok(!text.includes('—'), `${plugin} ${mode} contains an em-dash`);
    }
  }
});
