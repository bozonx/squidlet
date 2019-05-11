var System = require('./system/index');
var host = new System();
host.start().catch((err) => console.error(err));
