import IoSet from '../../system/interfaces/IoSet';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import {omitObj} from '../../system/lib/objects';
import Main from '../../system/Main';
import StartDevelop from './StartDevelop';


export default class StartIoServerStandalone extends StartDevelop {
  protected buildRoot = 'ioServer';


  async start() {
    await super.start();

    const ioSet: IoSet = await this.makeIoSet();

    this.main = await this.startMain(Main, ioSet, true, true);
  }

  /**
   * Remove useless props from host config such as entities definitions.
   */
  protected resolveHostConfig(): PreHostConfig {
    return omitObj(
      this.hostConfig,
      'plugins',
      'devices',
      'drivers',
      'services',
      'devicesDefaults',
      'automation',
      'mqttApi',
      'wsApi',
      'httpApi',
      'updater',
    );
  }

}
