import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import StartDevelopBase from './StartDevelopBase';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import SystemStarter from './SystemStarter';


export default class StartDevelop extends StartDevelopBase {
  async init() {
    await super.init();

    console.info(`Using work dir ${this.props.workDir}`);
    console.info(`Using host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await super.start();

    //await this.installModules();

    const ioSet: IoSet = await this.makeIoSet();
    const systemStarter = new SystemStarter(this.os, this.props);

    await systemStarter.start(SYSTEM_DIR, ioSet);
  }


  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  protected async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetDevelopSrc(this.os, this.envBuilder);

    return ioSet;
  }

}
