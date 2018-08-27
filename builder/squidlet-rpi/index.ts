import System from '../../host/src/app/System';


async function init() {
  const system = new System();

  await system.start();
}

init()
  .catch((err) => {
    throw new Error(err);
  });
