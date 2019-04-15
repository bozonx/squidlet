import Starter from './starter/Starter';


async function start () {
  const starter: Starter = new Starter('rpi');

  await starter.init();
  await starter.installProdModules();
  await starter.buildInitialProdSystem();
  await starter.startProdSystem();
}

start()
  .catch((err) => {
    console.error(err);
  });
