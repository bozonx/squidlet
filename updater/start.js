const fs = require('fs');

const squidletIndex = '/app/data/envSet/bundle.js';
const updaterIndex = '/app/updater.js';

let stat;
let appStarter;

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  appStarter = require(squidletIndex);
}
else {
  appStarter = require(updaterIndex);
}

appStarter.start(
  {
    hostType: 'updater',
    mqtt: {
      host: process.env.MQTT_BROKER_HOST,
      port: process.env.MQTT_BROKER_PORT,
    },
  },
  '/app/data',
  process.env.PUID,
  process.env.PGID,
  process.env.LOG_LEVEL,
  process.env.IOSERVER_MODE === 'true',
);

async function shutdown() {
  try {
    await appStarter.destroy();
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
