import ResolveParams from './starter/ResolveParams';
import Starter from './starter/Starter';


// async function start () {
//   const io: Io = new Io();
//   const params: ResolveParams = new ResolveParams();
//
//   console.info(`===> resolving config`);
//   params.resolve();
//
//   const groupConfig: GroupConfigParser = new GroupConfigParser(io, params.configPath);
//   const hostConfig: PreHostConfig = groupConfig.getHostConfig(params.hostName);
//   const dirs: ResolveDirs = new ResolveDirs();
//
//   dirs.resolve();
//
//   if (!hostConfig.platform) {
//     throw new Error(`Param "platform" is required on host config "${hostConfig.id}"`);
//   }
//   else if (!hostConfig.machine) {
//     throw new Error(`Param "machine" is required on host config "${hostConfig.id}"`);
//   }
//
//   const devSet: DevsSet = new DevsSet(hostConfig.platform, hostConfig.machine);
//
//   console.info(`===> making platform's dev set`);
//   devSet.collect();

// }

async function start () {
  const params: ResolveParams = new ResolveParams();

  params.resolve();

  const starter: Starter = new Starter(params);

  await starter.init();
  await starter.installModules();
  await starter.buildInitialSystem();
  await starter.startProdSystem();
}

start()
  .catch((err) => {
    console.error(err);
  });
