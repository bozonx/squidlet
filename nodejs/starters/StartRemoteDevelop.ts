import * as path from 'path';

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {SYSTEM_DIR} from '../../shared/helpers';
import SystemStarter from './SystemStarter';
import LogLevel from '../../system/interfaces/LogLevel';
import IoSetDevelopRemote from '../ioSets/IoSetDevelopRemote';
import StartDevelopBase from './StartDevelopBase';


export default class StartRemoteDevelop extends StartDevelopBase {
  private readonly argIoSet: string;


  constructor(
    configPath: string,
    argForce?: boolean,
    argLogLevel?: LogLevel,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
    argIoSet?: string,
  ) {
    super(configPath, argForce, argLogLevel, argMachine, argHostName, argWorkDir, argUser, argGroup);

    if (!argIoSet) throw new Error(`ioset param is required`);

    this.argIoSet = argIoSet;
  }

  async init() {
    await super.init();

    console.info(`Using remote ioset of host "${this.argIoSet}"`);
  }


  async start() {
    await super.start();
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  protected async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetDevelopRemote(
      this.os,
      // TODO: не передавать
      this.envBuilder,
      this.props.platform,
      this.props.machine,
      this.argIoSet
    );

    ioSet.prepare && await ioSet.prepare();

    return ioSet;
  }

}
