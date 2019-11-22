const fs = require('fs');

const squidletIndex = '/data/envSet/bundle.js';
const updaterIndex = '/app/updater.js';

let stat;

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  require(squidletIndex);
}
else {
  require(updaterIndex);
}
