import * as path from 'path';

import Io from '../../shared/Io';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import {DevClass} from '../../system/entities/DevManager';
import NodejsMachines from '../interfaces/NodejsMachines';
import EnvSetMemory from '../../hostEnvBuilder/EnvSetMemory';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {installNpmModules, makeSystemConfigExtend} from './helpers';
import {HOST_ENVSET_DIR} from '../../shared/constants';
import {makeDevelopIoSet, resolvePlatformDir} from '../../shared/helpers';


export default class StartDevelop {
  private readonly io: Io = new Io();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;


  constructor(configPath: string, machine?: NodejsMachines, hostName?: string, workDir?: string) {
    this.groupConfig = new GroupConfigParser(this.io, configPath);
    this.props = new Props(this.io, this.groupConfig, machine, hostName, workDir);
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


  private async installModules() {
    const platformDir = resolvePlatformDir(this.props.platform);
    const machineCwd: string = path.join(platformDir, this.props.machine);

    // do not install node modules if they have been installed previously
    if (await this.io.exists(path.join(machineCwd, 'node_modules'))) return;

    console.info(`===> Install npm modules`);

    await installNpmModules(this.io, machineCwd);
  }

  private async startSystem() {
    console.info(`===> making platform's dev set`);

    const platformDir = resolvePlatformDir(this.props.platform);
    const completedDevSet: {[index: string]: DevClass} = await makeDevelopIoSet(
      this.io,
      platformDir,
      this.props.machine
    );
    const System = require(`../../system`).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);

    await this.configureEnvSet();

    const system = new System(completedDevSet, systemConfigExtend, EnvSetMemory);

    return system.start();
  }

  private async configureEnvSet() {
    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);

    console.info(`===> generate hosts env files and configs`);

    await envBuilder.collect();

    console.info(`===> generate master config object`);

    const hostEnvSet: HostEnvSet = envBuilder.generateHostEnvSet();

    console.info(`===> initializing system`);

    EnvSetMemory.$registerConfigSet(hostEnvSet);
  }

}


// const platformDirName: string = resolvePlatformDir(this.platform);
// const devsDir: string = path.join(platformDirName, 'devs');
// const devsFileNames: string[] = await this.io.readdir(devsDir);
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
