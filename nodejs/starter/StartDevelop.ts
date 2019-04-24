import * as path from 'path';
import _omit = require('lodash/omit');

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import {installNpmModules, makeSystemConfigExtend} from './helpers';
import {resolveIoSetClass, resolvePlatformDir} from '../../shared/helpers';
import IoSet from '../../system/interfaces/IoSet';
import {IoSetConfig} from '../../hostEnvBuilder/interfaces/PreHostConfig';
import IoSetTypes from '../../hostEnvBuilder/interfaces/IoSetTypes';


export default class StartDevelop {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;


  constructor(
    configPath: string,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argIoset?: string,
    argIosetProps?: string
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argMachine,
      argHostName,
      argWorkDir,
      argIoset,
      argIosetProps
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}"`);
  }


  async start() {
    await this.installModules();
    await this.startSystem();
  }


  /**
   * Install node modules into squidlet repository in ./nodejs/<x86|rpi|arm>/ .
   * It installs only if node_modules directory doesn't exist.
   */
  private async installModules() {
    const platformDir = resolvePlatformDir(this.props.platform);
    const machineCwd: string = path.join(platformDir, this.props.machine);

    // do not install node modules if they have been installed previously
    if (await this.os.exists(path.join(machineCwd, 'node_modules'))) return;

    console.info(`===> Install npm modules`);

    await installNpmModules(this.os, machineCwd);
  }

  private async startSystem() {
    console.info(`===> making platform's dev set`);

    const ioSet: IoSet = this.makeIoSet();
    const System = require(`../../system`).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);

    console.info(`===> Starting system`);

    const system = new System(ioSet, systemConfigExtend);

    return system.start();
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  private makeIoSet(): IoSet {
    // TODO: review
    const ioSetConfig: IoSetConfig | undefined = this.props.hostConfig.ioSet;
    // use specified type or 'nodejs-developLocal' by default
    const ioType: IoSetTypes = (ioSetConfig) ? ioSetConfig.type : 'nodejs-developLocal';

    console.info(`===> using io set "${ioType}"`);

    // if (!ioType) {
    //   // TODO: подставить по умолчанию nodejs-developLocal если не было подставленно
    // }
    // else

    if (ioType !== 'nodejs-developLocal' && ioType !== 'nodejs-developWs') {
      throw new Error(`Unsupported ioSet type: "${ioType}"`);
    }

    const ResolvedIoSet = resolveIoSetClass(ioType);

    return new ResolvedIoSet(_omit(ioSetConfig, 'type'));
  }

}
