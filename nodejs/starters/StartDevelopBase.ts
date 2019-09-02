import * as path from 'path';

import {isEmptyObject} from '../../system/lib/objects';
import Os, {SpawnCmdResult} from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {REPO_ROOT, SYSTEM_DIR} from '../../shared/helpers';
import SystemStarter from './SystemStarter';
import {IoSetClass} from '../interfaces/IoSetClass';
import LogLevel from '../../system/interfaces/LogLevel';


export default abstract class StartDevelopBase {
  protected  readonly os: Os = new Os();
  protected  readonly groupConfig: GroupConfigParser;
  protected  readonly props: Props;
  private _envBuilder?: EnvBuilder;
  protected get envBuilder(): EnvBuilder {
    return this._envBuilder as any;
  }


  constructor(
    configPath: string,
    argForce?: boolean,
    argLogLevel?: LogLevel,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argForce,
      argLogLevel,
      argMachine,
      argHostName,
      argWorkDir,
      argUser,
      argGroup,
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);

    this._envBuilder = new EnvBuilder(
      this.props.hostConfig,
      this.props.envSetDir,
      tmpDir,
      this.props.platform,
      this.props.machine,
      { uid: this.props.uid, gid: this.props.gid }
    );
  }


  async start() {
    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    await this.os.mkdirP(this.props.varDataDir, { uid: this.props.uid, gid: this.props.gid });
    await this.os.mkdirP(this.props.envSetDir, { uid: this.props.uid, gid: this.props.gid });
  }


  /**
   * Prepare ioSet here.
   */
  protected abstract async makeIoSet(): Promise<IoSet>;

}
