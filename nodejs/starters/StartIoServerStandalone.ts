import IoSet from '../../system/interfaces/IoSet';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import {omitObj} from '../../system/lib/objects';
import SolidStarter from '../../system/SolidStarter';
import StartDevelop from './StartDevelop';


export default class StartIoServerStandalone extends StartDevelop {
  async start() {
    await super.start();

    const ioSet: IoSet = await this.makeIoSet();

    this.starter = await this.startSolid(SolidStarter, ioSet, true, true);
  }

  /**
   * Remove useless props from host config such as entities definitions.
   */
  protected resolveHostConfig(): PreHostConfig {
    return omitObj(
      this.props.hostConfig,
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
