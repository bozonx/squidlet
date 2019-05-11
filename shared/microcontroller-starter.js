var devSet = require('./devs/index');
var System = require('./system/index');

// TODO: review

var host = new System(devSet);
host.start().catch((err) => console.error(err));
