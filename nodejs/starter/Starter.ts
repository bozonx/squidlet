import * as path from 'path';

import Io from '../../shared/Io';
import ResolveArgs from './ResolveArgs';
import GroupConfigParser from '../../control/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import systemConfig from '../../host/config/systemConfig';
import BuildSystem from '../../control/BuildSystem';
import {BUILD_SYSTEM_DIR, HOST_ENVSET_DIR} from '../../control/constants';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import BuildHostEnv from '../../control/BuildHostEnv';


const systemClassFileName = 'System';


export default class Starter {
  private readonly io: Io = new Io();
  private readonly args: ResolveArgs;
  private readonly groupConfig: GroupConfigParser = new GroupConfigParser(this.io, this.args.configPath);
  private readonly props: Props = new Props(this.args, this.groupConfig);
  private readonly devSet: DevsSet = new DevsSet(this.io, this.props);


  constructor(args: ResolveArgs) {
    this.args = args;
  }

  async init() {
    console.info(`===> resolving config`);
    await this.groupConfig.init();

    this.props.resolve();

    console.info(`===> making platform's dev set`);
    await this.devSet.collect();
  }


  async installModules() {
    console.info(`===> Install npm modules`);
    // TODO: делается npm i в папку с devs если нужно
  }

  async buildInitialProdSystem() {
    const pathToSystemDir = this.getPathToProdSystemDir();

    // else if it exists - do nothing
    if (await this.io.exists(pathToSystemDir)) return;

    await this.buildSystem();

    const initialHostConfig: PreHostConfig = {
      // TODO: generae id or special guid
      id: 'initialHost',
      platform: this.props.platform,
      machine: this.props.machine,
    }

    await this.buildHostEnv(initialHostConfig);
  }

  async buildDevelopEnvSet() {
    // TODO: сбилдить конфиги хоста где указанны пути к реальному главному ts файлу
  }

  async startProdSystem() {
    const pathToSystem = path.join(this.getPathToProdSystemDir(), systemClassFileName);
    const System = require(pathToSystem).default;
    const system = new System(this.devSet.devSet);

    return system.start();
  }

  async startDevelopSystem() {
    const System = require(`../../host/System`).default;
    const system = new System(this.devSet.devSet);

    return system.start();
  }


  private getPathToProdSystemDir(): string {
    return path.join(this.props.envSetDir, systemConfig.rootDirs.host);
  }

  private async buildSystem() {
    const systemBuildDir = this.getPathToProdSystemDir();
    const systemTmpDir = path.join(this.props.tmpDir, BUILD_SYSTEM_DIR);
    const buildSystem: BuildSystem = new BuildSystem(this.io);

    console.info(`===> Building system`);
    await buildSystem.build(systemBuildDir, systemTmpDir);
  }

  private async buildHostEnv(hostConfig: PreHostConfig) {
    const hostBuildDir = path.join(this.props.envSetDir);
    const hostTmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.io,
      hostConfig,
      hostBuildDir,
      hostTmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();
  }

}

//const initalHostConfigPath = '../../shared/initialHostConfig.yaml';
// const initialHostConfigPath: string = path.resolve(__dirname, initalHostConfigPath);
// const initialHostConfig: PreHostConfig = await this.io.loadYamlFile(initialHostConfigPath);
// initialHostConfig.platform = this.props.platform;
// initialHostConfig.machine = this.props.machine;
