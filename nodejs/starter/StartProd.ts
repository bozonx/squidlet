import * as path from 'path';

import Io from '../../shared/Io';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import systemConfig from '../../system/config/systemConfig';
import BuildSystem from '../../shared/BuildSystem';
import {
  BUILD_DEVS_DIR,
  BUILD_SYSTEM_DIR,
  HOST_ENVSET_DIR,
} from '../../shared/constants';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import BuildHostEnv from '../../shared/BuildHostEnv';
import {DevClass} from '../../system/entities/DevManager';
import BuildDevs from '../../shared/BuildDevs';
import NodejsMachines from '../interfaces/NodejsMachines';
import {installNpmModules, makeSystemConfigExtend} from './helpers';


const systemClassFileName = 'System';


export default class StartProd {
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
    await this.buildInitialSystem();
    await this.installModules();
    await this.startSystem();
  }


  private async installModules() {
    console.info(`===> Install npm modules`);
    const cwd: string = path.join(this.props.envSetDir, BUILD_DEVS_DIR);

    await installNpmModules(this.io, cwd);
  }

  private async buildInitialSystem() {
    const pathToSystemDir = this.getPathToProdSystemDir();

    // else if it exists - do nothing
    if (await this.io.exists(pathToSystemDir)) return;

    await this.buildSystem();

    const initialHostConfig: PreHostConfig = {
      // TODO: generae id or special guid
      id: 'initialHost',
      platform: this.props.platform,
      machine: this.props.machine,
    };

    // build config and entities
    await this.buildEnvSet(initialHostConfig);
    // build devs
    await this.buildHostDevs(initialHostConfig);
  }

  private async startSystem() {
    console.info(`===> making platform's dev set`);

    const devSet: DevsSet = new DevsSet(
      this.io,
      this.props.platform,
      this.props.machine,
      this.props.envSetDir
    );
    const completedDevSet: {[index: string]: DevClass} = await devSet.makeProdDevSet();
    const pathToSystem = path.join(this.getPathToProdSystemDir(), systemClassFileName);
    const System = require(pathToSystem).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);
    // make system instance
    const system = new System(completedDevSet, systemConfigExtend);

    return system.start();
  }

  private getPathToProdSystemDir(): string {
    return path.join(this.props.envSetDir, systemConfig.envSetDirs.system);
  }

  private async buildSystem() {
    const systemBuildDir = this.getPathToProdSystemDir();
    const systemTmpDir = path.join(this.props.tmpDir, BUILD_SYSTEM_DIR);
    const buildSystem: BuildSystem = new BuildSystem(this.io);

    console.info(`===> Building system`);
    await buildSystem.build(systemBuildDir, systemTmpDir);
  }

  private async buildEnvSet(hostConfig: PreHostConfig) {
    const buildDir = path.join(this.props.envSetDir);
    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.io,
      hostConfig,
      buildDir,
      tmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();
  }

  private async buildHostDevs(hostConfig: PreHostConfig) {
    const buildDir = path.join(this.props.envSetDir, BUILD_DEVS_DIR);
    const tmpDir = path.join(this.props.tmpDir, BUILD_DEVS_DIR);
    const buildDevs: BuildDevs = new BuildDevs(
      this.io,
      hostConfig,
      buildDir,
      tmpDir
    );

    console.info(`===> Building devs`);

    await buildDevs.build();
  }

}
