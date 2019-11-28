import IoSet from '../../system/interfaces/IoSet';
import {SYSTEM_DIR} from '../../shared/helpers';
import StartDevelopBase from './StartDevelopBase';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import SystemStarter from './SystemStarter';


export default class StartDevelop extends StartDevelopBase {
  async init() {
    await super.init();

    console.info(`Using app work dir ${this.props.appWorkDir} and build dir ${this.props.buildWorkDir}`);
    console.info(`Using host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await super.start();

    const ioSet: IoSet = await this.makeIoSet();
    const systemStarter = new SystemStarter(this.os, this.props);

    await systemStarter.start(SYSTEM_DIR, ioSet);
  }


  /**
   * Make development IO set which loads local ts files of IOs.
   */
  protected async makeIoSet(): Promise<IoSet> {
    return new IoSetDevelopSrc(this.os, this.envBuilder);
  }

}
