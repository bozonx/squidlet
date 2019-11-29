import IoSet from '../../system/interfaces/IoSet';
import StartBase from './StartBase';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import SolidStarter from '../../system/SolidStarter';


export default class StartDevelop extends StartBase {
  async init() {
    await super.init();

    await this.os.mkdirP(this.props.appWorkDir, { uid: this.props.uid, gid: this.props.gid });

    console.info(`Using app work dir ${this.props.appWorkDir} and build dir ${this.props.buildWorkDir}`);
    console.info(`Using host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await super.start();

    // TODO: may be move to base
    const ioSet: IoSet = await this.makeIoSet();

    this.starter = await this.startSolid(SolidStarter, ioSet);
  }


  /**
   * Make development IO set which loads local ts files of IOs.
   */
  protected async makeIoSet(): Promise<IoSet> {
    return new IoSetDevelopSrc(this.os, this.envBuilder);
  }

}
