import ResolveParams from './starter/ResolveParams';
import DevsSet from './starter/DevsSet';
import GroupConfigParser from '../control/GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import ResolveDirs from './starter/ResolveDirs';


async function start () {
  const io: Io = new Io();
  const params: ResolveParams = new ResolveParams();

  console.info(`===> resolving config`);
  params.resolve();

  const groupConfig: GroupConfigParser = new GroupConfigParser(io, params.configPath);
  const hostConfig: PreHostConfig = groupConfig.getHostConfig(params.hostName);
  const dirs: ResolveDirs = new ResolveDirs();

  dirs.resolve();

  if (!hostConfig.platform) {
    throw new Error(`Param "platform" is required on host config "${hostConfig.id}"`);
  }
  else if (!hostConfig.machine) {
    throw new Error(`Param "machine" is required on host config "${hostConfig.id}"`);
  }

  const devSet: DevsSet = new DevsSet(hostConfig.platform, hostConfig.machine);

  console.info(`===> making platform's dev set`);
  devSet.collect();

  // TODO: делается npm i в папку с devs



  // TODO: если нету system - то билдится он и env set с конфигом по умолчанию
  // TODO: запускается System с этим devset
}

start()
  .catch((err) => {
    console.error(err);
  });
