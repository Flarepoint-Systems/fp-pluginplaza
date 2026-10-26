'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const audit = require('../src/audit');
const inject = require('../src/inject');
const statusline = require('../src/statusline');

test('audit grounds a claim only when an action touched its reference', () => {
  const log = [{ tool: 'grep', target: 'src/auth.js' }];
  assert.equal(audit.isGrounded({ refs: ['src/auth.js'] }, log), true);
  assert.equal(audit.isGrounded({ refs: ['src/other.js'] }, log), false);
  assert.equal(audit.isGrounded({ refs: [] }, log), false); // nothing to have checked
});

test('audit caps an ungrounded "verified" down to inferred', () => {
  const log = [{ tool: 'read', target: 'README.md' }];
  const grounded = audit.verify({ provenance: 'verified', refs: ['README.md'] }, log);
  assert.equal(grounded.provenance, 'verified');
  const ungrounded = audit.verify({ provenance: 'verified', refs: ['secrets.js'] }, log);
  assert.equal(ungrounded.provenance, 'inferred');
  assert.equal(ungrounded.grounded, false);
});

test('inject is silent when off or empty, framed otherwise', () => {
  assert.equal(inject.build('honesty', { mode: 'off', rules: 'x' }), '');
  assert.equal(inject.build('honesty', { mode: 'full' }), '');
  const out = inject.build('honesty', {
    mode: 'full',
    rules: 'Be honest.',
    suggestion: { line: 'backstop: re-check config.js' },
  });
  assert.match(out, /^<fp:honesty mode=full>/);
  assert.match(out, /Be honest\./);
  assert.match(out, /re-check config\.js/);
  assert.match(out, /<\/fp:honesty>$/);
});

test('statusline is opt-in and shows only active segments', () => {
  const segs = [
    { label: 'honesty', value: 'full', active: true },
    { label: 'mem', value: 5, active: true },
    { label: 'profile', value: 'prod', active: false },
  ];
  assert.equal(statusline.render(segs, { enabled: false }), '');
  assert.equal(statusline.render(segs, { enabled: true }), 'fp · honesty:full · mem:5');
});
