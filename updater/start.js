const fs = require('fs');

const squidletIndex = '/app/data/envSet/bundle.js';
const updaterIndex = '/app/updater.js';

let stat;
let Starter;
let hostType = 'app';
const env = process.env;

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  Starter = require(squidletIndex);
}
else {
  Starter = require(updaterIndex);
  hostType = 'updater';
}

const starter = new Starter();

starter.start(
  {
    hostType,
    mqtt: {
      host: env.MQTT_BROKER_HOST || undefined,
      port: (env.MQTT_BROKER_PORT) ? Number(env.MQTT_BROKER_PORT) : undefined,
    },
  },
  '/app/data',
  (env.PUID) ? Number(env.PUID) : undefined,
  (env.PGID) ? Number(env.PGID) : undefined,
  process.env.LOG_LEVEL || undefined,
  process.env.IOSERVER_MODE === 'true',
)
  .catch(console.error);

async function gracefullyShutdown() {
  if (starter.hasBeenStarted) {
    try {
      await starter.destroy();
    }
    catch (e) {
      console.error(e);
    }
  }

  process.exit(0);
}

process.on('SIGTERM', () => {
  console.info('SIGTERM signal has been caught');

  gracefullyShutdown()
    .catch(console.error);
});

process.on('SIGINT', () => {
  console.info('SIGINT signal has been caught');

  gracefullyShutdown()
    .catch(console.error);
});
