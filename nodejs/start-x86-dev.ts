// TODO: делается npm i в папку с devs
// TODO: собирается devSet через require

// TODO: билдится конфиг хоста
// TODO: system и entities - запускаются прямо из репозитория

import ResolveParams from './starter/ResolveParams';
import Starter from './starter/Starter';


async function start () {
  const params: ResolveParams = new ResolveParams();

  params.resolve();

  const starter: Starter = new Starter(params);

  await starter.init();
  await starter.installModules();
  await starter.buildDevelopEnvSet();
  await starter.startDevelopSystem();
}

start()
  .catch((err) => {
    console.error(err);
  });
