var devSet = require('./devs/index');
var System = require('./system/index');
var host = new System(devSet);
host.start().catch((err) => console.error(err));
