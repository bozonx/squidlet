const fs = require('fs');

const squidletIndex = '/app/data/envSet/bundle/bundle.js';
const updaterIndex = '/app/updater.js';

let stat;
let instantiateStarter;
let appType = 'app';
const env = process.env;

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  instantiateStarter = require(squidletIndex);
}
else {
  instantiateStarter = require(updaterIndex);
  appType = 'updater';
}

const starter = instantiateStarter();
const hostConfigOverride = {
  appType,
  mqtt: {
    host: env.MQTT_BROKER_HOST || undefined,
    port: (env.MQTT_BROKER_PORT) ? Number(env.MQTT_BROKER_PORT) : undefined,
  },
};

starter.start(
  (code) => process.exit(code),
  hostConfigOverride,
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
      process.emit(3);
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
