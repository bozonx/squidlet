import ResolveParams from './starter/ResolveParams';
import Starter from './starter/Starter';


async function start () {
  const params: ResolveParams = new ResolveParams();

  params.resolve();

  const starter: Starter = new Starter(params);

  await starter.init();
  await starter.installModules();
  await starter.buildInitialProdSystem();
  await starter.startProdSystem();
}

start()
  .catch((err) => {
    console.error(err);
  });
