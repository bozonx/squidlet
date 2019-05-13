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

    // TODO: review может вообще i2c-bus и pigpio устанавливать глобально??? если они не работают на x86

    // TODO: проверить чтобы были установленны node_modules в корне самого squidlet

    //await this.installModules();
    await this.startSystem();
  }


  /**
   * Resolve development io set (nodejs-developLocal or nodejs-developWs)
   * and start development version of System.
   */
  private async startSystem() {
    const System = require(`../../system`).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);
    const ioSetType: IoSetTypes = this.resolveIoSetType();

    console.info(`===> using io set "${ioSetType}"`);

    const ioSet: IoSet | undefined = this.makeIoSet(ioSetType);

    console.info(`===> Starting system`);

    const system = new System(ioSet, systemConfigExtend);

    return system.start();
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  private makeIoSet(ioSetType: IoSetTypes): IoSet | undefined {

    // TODO: review

    const ResolvedIoSet = resolveIoSetClass(ioSetType);

    return new ResolvedIoSet(_omit(this.props.hostConfig.ioSet, 'type'));
  }

  /**
   * Only nodejs-developLocal or nodejs-developWs ioSet types are allowed
   * If there isn't hostConfig.ioSet or ioSet.type = local it returns undefined.
   */
  private resolveIoSetType(): IoSetTypes {

    // TODO: review

    const ioSetConfig: IoSetConfig | undefined = this.props.hostConfig.ioSet;

    if (!ioSetConfig || ioSetConfig.type === 'nodejs-developLocal') {
      return 'nodejs-developLocal';
    }
    else if (ioSetConfig.type !== 'nodejs-developWs') {
      throw new Error(`Unsupported ioSet type: "${ioSetConfig.type}"`);
    }

    return ioSetConfig.type;
  }

}


// /**
//  * Install node modules into squidlet repository in ./nodejs/<x86|rpi|arm>/ .
//  * It installs only if node_modules directory doesn't exist.
//  */
// private async installModules() {
//
//
//   const platformDir = resolvePlatformDir(this.props.platform);
//   const machineCwd: string = path.join(platformDir, this.props.machine);
//
//   // do not install node modules if they have been installed previously
//   if (await this.os.exists(path.join(machineCwd, 'node_modules'))) return;
//
//   console.info(`===> Install npm modules`);
//
//   await installNpmModules(this.os, machineCwd);
// }
