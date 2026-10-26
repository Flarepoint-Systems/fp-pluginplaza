'use strict';

// Public surface of fp-base. Plugins load it as `require('./_fpbase')` through
// the symlink at hooks/_fpbase; tests fall back to `require('@flarepoint/base')`.

module.exports = {
  config: require('./config'),
  mode: require('./mode'),
  provenance: require('./provenance'),
  audit: require('./audit'),
  inject: require('./inject'),
  primed: require('./primed'),
  statusline: require('./statusline'),
  util: require('./util'),
};
