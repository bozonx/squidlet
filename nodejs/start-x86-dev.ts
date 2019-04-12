import ResolveArgs from './starter/ResolveArgs';
import Starter from './starter/Starter';


async function start () {
  const args: ResolveArgs = new ResolveArgs('x86');

  args.resolve();

  const starter: Starter = new Starter(args);

  await starter.init();
  await starter.installModules();
  await starter.buildDevelopEnvSet();
  await starter.startDevelopSystem();
}

start()
  .catch((err) => {
    console.error(err);
  });
