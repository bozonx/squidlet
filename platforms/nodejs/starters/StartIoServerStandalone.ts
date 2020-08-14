import PreHostConfig from '../../../hostEnvBuilder/interfaces/PreHostConfig';
import {pickObj} from '../../../system/lib/objects';
import StartDevelop from './StartDevelop';


export default class StartIoServerStandalone extends StartDevelop {
  protected buildRoot = 'ioServer';
  protected lockAppSwitch = true;


  async start() {
    await super.start(true);
  }

  /**
   * Remove useless props from host config such as entities definitions.
   */
  protected resolveHostConfig(): PreHostConfig {
    return {
      ...pickObj(this.hostConfig,
        'id',
        'config',
        'ios',
        'ioServer'
      ),
      // ...omitObj(
      //   this.hostConfig,
      //   'plugins',
      //   'devices',
      //   'drivers',
      //   'services',
      //   'devicesDefaults',
      //   'automation',
      //   'network',
      //   'wsApi',
      //   'httpApi',
      //   'updater',
      // ),
      // TODO: add plugins - сервисы ioServer
      // TODO: add drivers ??? - необходимые для ioServer
      // TODO: add services - сервисы ioServer
    };
  }

}
