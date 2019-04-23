import * as path from 'path';
import _omit = require('lodash/omit');

import Io from '../../shared/Io';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import {installNpmModules, makeSystemConfigExtend} from './helpers';
import {resolvePlatformDir} from '../../shared/helpers';
import IoSet from '../../system/interfaces/IoSet';
import {firstLetterToUpperCase} from '../../system/helpers/helpers';


const ioSetsRoot = '../../ioSets';


export default class StartDevelop {
  private readonly io: Io = new Io();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;


  constructor(
    configPath: string,
    machine?: NodejsMachines,
    hostName?: string,
    workDir?: string,
    ioset?: string,
    iosetProps?: string
  ) {
    this.groupConfig = new GroupConfigParser(this.io, configPath);
    this.props = new Props(this.io, this.groupConfig, machine, hostName, workDir, ioset, iosetProps);
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

    const ioSet: IoSet = this.makeIoSet();
    const System = require(`../../system`).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);

    console.info(`===> Starting system`);

    const system = new System(ioSet, systemConfigExtend);

    return system.start();
  }

  private makeIoSet(): IoSet {
    const platformDir = resolvePlatformDir(this.props.platform);
    const ioSetConfig = this.props.hostConfig.ioSet as {[index: string]: any};
    const isSetFileName = `${firstLetterToUpperCase(ioSetConfig.type)}IoSet`;
    const SelectedIoSet: new () => IoSet = require(path.join(ioSetsRoot, isSetFileName)).default;

    return new SelectedIoSet(_omit(ioSetConfig, 'type'));
  }

}


// const completedDevSet: {[index: string]: DevClass} = await makeDevelopIoSet(
//   this.io,
//   platformDir,
//   this.props.machine
// );

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
