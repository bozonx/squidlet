import * as path from 'path';
import _omit = require('lodash/omit');

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import {installNpmModules, makeSystemConfigExtend} from './helpers';
import {resolvePlatformDir} from '../../shared/helpers';
import IoSet from '../../system/interfaces/IoSet';
import {firstLetterToUpperCase} from '../../system/helpers/helpers';


const ioSetsRoot = '../../ioSets';


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
    const ioSetConfig = this.props.hostConfig.ioSet as {[index: string]: any};
    const isSetFileName = `${firstLetterToUpperCase(ioSetConfig.type)}IoSet`;
    const ioSetPath = path.join(ioSetsRoot, isSetFileName);
    const SelectedIoSet: new (ioSetConfig: {[index: string]: any}) => IoSet = require(ioSetPath).default;

    return new SelectedIoSet(_omit(ioSetConfig, 'type'));
  }

}


//const platformDir = resolvePlatformDir(this.props.platform);
// const completedDevSet: {[index: string]: DevClass} = await makeDevelopIoSet(
//   this.os,
//   platformDir,
//   this.props.machine
// );

// const platformDirName: string = resolvePlatformDir(this.platform);
// const devsDir: string = path.join(platformDirName, 'devs');
// const devsFileNames: string[] = await this.os.readdir(devsDir);
// const devsSet: {[index: string]: new (...params: any[]) => any} = {};
//
// for (let fullDevName of devsFileNames) {
//   const devPath = path.join(devsDir, fullDevName);
//
//   devsSet[fullDevName] = require(devPath).default;
// }
//
// return devsSet;

// const devsSet: {[index: string]: new (...params: any[]) => any} = {};
// const platformDir = resolvePlatformDir(this.platform);
// const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);
//
// for (let devPath of machineConfig.devs) {
//   const devName: string = parseDevName(devPath);
//   const devAbsPath = path.resolve(platformDir, devPath);
//
//   devsSet[devName] = require(devAbsPath).default;
// }
//
// return devsSet;
