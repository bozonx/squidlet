const fs = require('fs');

const env = process.env;
const workDir = env.WORK_DIR;
const squidletIndex = workDir + '/envSet/bundle/bundle.js';
const updaterIndex = './bundle.js';

let stat;
let instantiateMain;
const hostConfigOverride = {
  mqtt: {
    host: env.MQTT_BROKER_HOST || undefined,
    port: (env.MQTT_BROKER_PORT) ? Number(env.MQTT_BROKER_PORT) : undefined,
  },
};

try {
  stat = fs.statSync(squidletIndex);
}
catch (e) {
}

if (stat && stat.isFile()) {
  instantiateMain = require(squidletIndex);

  if (process.env.IOSERVER_MODE === 'true') {
    hostConfigOverride.appType = 'ioServer';
  }
}
else {
  instantiateMain = require(updaterIndex);
  hostConfigOverride.appType = 'updater';
}

const main = instantiateMain(
  hostConfigOverride,
  process.env.LOG_LEVEL || undefined,
);

async function start() {
  await main.init();
  await main.configureIoSet(
    (code) => process.exit(code),
    workDir,
    (env.PUID) ? Number(env.PUID) : undefined,
    (env.PGID) ? Number(env.PGID) : undefined
  );
  await main.start()
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
