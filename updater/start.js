const fs = require('fs');

const squidletIndex = '/app/data/envSet/bundle/bundle.js';
const updaterIndex = '/app/bundle.js';

let stat;
let instantiateMain;
let appType = 'app';
const env = process.env;

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  instantiateMain = require(squidletIndex);
}
else {
  instantiateMain = require(updaterIndex);
  appType = 'updater';
}

const main = instantiateMain();
const hostConfigOverride = {
  appType,
  mqtt: {
    host: env.MQTT_BROKER_HOST || undefined,
    port: (env.MQTT_BROKER_PORT) ? Number(env.MQTT_BROKER_PORT) : undefined,
  },
};

async function start() {
  await main.init(hostConfigOverride, process.env.LOG_LEVEL || undefined);
  await main.configureIoSet(
    (code) => process.exit(code),
    '/app/data',
    (env.PUID) ? Number(env.PUID) : undefined,
    (env.PGID) ? Number(env.PGID) : undefined
  );
  await main.start(process.env.IOSERVER_MODE === 'true')
}

start()
  .catch(console.error);

async function gracefullyShutdown() {
  if (main.hasBeenStarted) {
    try {
      await main.destroy();
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
