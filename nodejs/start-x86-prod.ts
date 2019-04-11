import {DevClass} from '../host/entities/DevManager';
import ResolveParams from './starter/ResolveParams';


async function start () {
  const params: ResolveParams = new ResolveParams();

  params.resolve();

  // TODO: делается npm i в папку с devs

  console.info(`--> making platform's dev set`);

  const machine: string = hostConfigSet.configs.config.machine;
  const devsSet: {[index: string]: DevClass} = collectDevs(hostConfigSet.configs.config.platform, machine);

  // TODO: если нету system - то билдится он и env set с конфигом по умолчанию
  // TODO: запускается System с этим devset
}

start()
  .catch((err) => {
    console.error(err);
  });
