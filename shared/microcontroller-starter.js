var devSet = require(`./devs/index`);
var System = require('./host/index');
var host;

// try {
//   System = require('./host/index');
// }
// catch (e) {
//   System = require('./starter');
// }

host = new System(devSet);

host.start()
  .catch((err) => {
    console.error(`System initializing error: ${String(err)}`);
  });
