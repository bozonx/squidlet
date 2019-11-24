const fs = require('fs');

const squidletIndex = '/app/data/envSet/bundle.js';
const updaterIndex = '/app/updater.js';

let stat;
let system;

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  system = require(squidletIndex);
}
else {
  system = require(updaterIndex);
}

system.start({
  user: process.env.PUID,
  group: process.env.PGID,
  logLevel: process.env.LOG_LEVEL,
  ioServerMode: process.env.IOSERVER_MODE,
  workDir: '/app/data',
  hostConfig: {
    hostType: 'updater',
    mqtt: {
      host: process.env.MQTT_BROKER_HOST,
      port: process.env.MQTT_BROKER_PORT,
    },
  },
});

async function shutdown() {
  try {
    await system.destroy();
  }
  catch (e) {
    console.error(e);
  }

  process.exit(0);
}

process.on('SIGTERM', () => {
  console.info('SIGTERM signal has been caught');

  shutdown()
    .catch(console.error);
});
process.on('SIGINT', () => {
  console.info('SIGINT signal has been caught');

  shutdown()
    .catch(console.error);
});
