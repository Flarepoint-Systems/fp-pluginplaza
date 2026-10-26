'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const primed = require('../src/primed');

const texts = { full: 'FULL', reminder: 'SHORT' };

function session() {
  const id = `t-${process.pid}-${Math.random().toString(36).slice(2)}`;
  return { id, cleanup: () => fs.rmSync(primed.file('x', id), { force: true }) };
}

test('first prompt of a session gets the full prior, later ones the reminder', (t) => {
  const s = session();
  t.after(s.cleanup);
  assert.equal(primed.pick('x', s.id, 'on', texts), 'FULL');
  assert.equal(primed.pick('x', s.id, 'on', texts), 'SHORT');
});

test('a mode change re-sends the full prior once', (t) => {
  const s = session();
  t.after(s.cleanup);
  primed.set('x', s.id, 'tidy');
  assert.equal(primed.pick('x', s.id, 'new', texts), 'FULL');
  assert.equal(primed.pick('x', s.id, 'new', texts), 'SHORT');
});

test('off injects nothing; no session id always gets the full prior', () => {
  assert.equal(primed.pick('x', 'whatever', 'off', texts), '');
  assert.equal(primed.pick('x', '', 'on', texts), 'FULL');
  assert.equal(primed.pick('x', '', 'on', texts), 'FULL');
});
