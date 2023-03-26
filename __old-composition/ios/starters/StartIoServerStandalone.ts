import PreHostConfig from '../../../../../../__old/hostEnvBuilder/interfaces/PreHostConfig';
import {pickObj} from '../../../../../../../squidlet-lib/src/objects';
import StartDevelop from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/ios/nodejs/__old/starters/StartDevelop';


export default class StartIoServerStandalone extends StartDevelop {
  protected buildRoot = 'ioServer';


  // /**
  //  * Remove useless props from host config such as entities definitions.
  //  */
  // protected resolveHostConfig(): PreHostConfig {
  //   return {
  //     ...pickObj(this.hostConfig,
  //       'id',
  //       'config',
  //       'ios',
  //       'ioServer'
  //     ),
  //     services: {
  //       ioServer: {
  //         service: 'IoServer',
  //       },
  //     },
  //     // ...omitObj(
  //     //   this.hostConfig,
  //     //   'plugins',
  //     //   'devices',
  //     //   'drivers',
  //     //   'services',
  //     //   'devicesDefaults',
  //     //   'automation',
  //     //   'network',
  //     //   'wsApi',
  //     //   'httpApi',
  //     //   'updater',
  //     // ),
  //     // TODO: add plugins - сервисы ioServer
  //     // TODO: add drivers ??? - необходимые для ioServer
  //     // TODO: add services - сервисы ioServer
  //   };
  // }

}
