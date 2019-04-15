import Starter from './starter/Starter';


async function start () {
  const starter: Starter = new Starter('rpi');

  await starter.init();
  await starter.installDevModules();
  await starter.buildDevelopEnvSet();
  await starter.startDevelopSystem();
}

start()
  .catch((err) => {
    console.error(err);
  });
