import System from './app/System';


async function init() {
  const system = new System();

  await system.initSystemDrivers();
  await system.initNetwork();
  await system.initMessenger();
  await system.initSystemServices();
  await system.initApp();
}

init()
  .catch((err) => {
    throw new Error(err);
  });
