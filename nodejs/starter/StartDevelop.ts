import * as path from 'path';

import Io from '../../shared/Io';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import {DevClass} from '../../system/entities/DevManager';
import NodejsMachines from '../interfaces/NodejsMachines';
import EnvSetMemory from '../../hostEnvBuilder/EnvSetMemory';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {installNpmModules, makeSystemConfigExtend} from './helpers';


const systemClassFileName = 'System';


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

    console.info(`Using working dir ${this.props.workDir}`);
    console.info(`Using host "${this.props.hostConfig.id}" on machine "${this.props.machine}"`);
  }


  async start() {
    //await this.buildDevelopEnvSet();
    await this.installDevModules();
    await this.startDevelopSystem();
  }


  private async installDevModules() {
    console.info(`===> Install npm modules`);
    const cwd: string = path.resolve(__dirname, '../', this.props.machine);

    await installNpmModules(this.io, cwd);
  }

  // private async buildDevelopEnvSet() {
  //   // TODO: сбилдить конфиги хоста где указанны пути к реальному главному ts файлу
  // }

  private async startDevelopSystem() {
    console.info(`===> making platform's dev set`);

    const devSet: DevsSet = new DevsSet(
      this.io,
      this.props.platform,
      this.props.machine,
      this.props.envSetDir
    );
    const completedDevSet: {[index: string]: DevClass} = await devSet.makeDevelopDevSet();
    const System = require(`../../system`).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);

    // TODO: review
    // TODO: нужна ли build dir и tmp dir ???

    const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, '', '');

    console.info(`===> generate hosts env files and configs`);

    await envBuilder.collect();

    console.info(`===> generate master config object`);



    const hostEnvSet: HostEnvSet = envBuilder.generateHostEnvSet();

    console.info(`===> initializing host system on machine`);

    EnvSetMemory.$registerConfigSet(hostEnvSet);

    const system = new System(completedDevSet, systemConfigExtend, EnvSetMemory);

    return system.start();
  }


}

//const initalHostConfigPath = '../../shared/initialHostConfig.yaml';
// const initialHostConfigPath: string = path.resolve(__dirname, initalHostConfigPath);
// const initialHostConfig: PreHostConfig = await this.io.loadYamlFile(initialHostConfigPath);
// initialHostConfig.platform = this.props.platform;
// initialHostConfig.machine = this.props.machine;
