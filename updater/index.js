const fs = require('fs');

const squidletIndex = '/data/envSet/bundle.js';
const updaterIndex = '/updater/index.js';
const stat = fs.statSync(squidletIndex);

if (stat.isFile()) {
  require(squidletIndex)();
}
else {
  require(updaterIndex)();
}
