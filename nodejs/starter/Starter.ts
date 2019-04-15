import * as path from 'path';

import Io from '../../shared/Io';
import ResolveArgs from './ResolveArgs';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import systemConfig from '../../system/config/systemConfig';
import BuildSystem from '../../shared/BuildSystem';
import {BUILD_DEVS_DIR, BUILD_SYSTEM_DIR, HOST_ENVSET_DIR} from '../../shared/constants';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import BuildHostEnv from '../../shared/BuildHostEnv';
import {DevClass} from '../../system/entities/DevManager';
import BuildDevs from '../../shared/BuildDevs';


const systemClassFileName = 'System';


export default class Starter {
  private readonly io: Io = new Io();
  private readonly machine: string;
  private readonly args: ResolveArgs;
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly devSet: DevsSet;


  constructor(machine: string) {
    this.machine = machine;
    this.args = new ResolveArgs();
    this.groupConfig = new GroupConfigParser(this.io, this.args.configPath);
    this.props = new Props(this.args, this.groupConfig);
    this.devSet = new DevsSet(this.io, this.props.platform, this.machine);
  }

  async init() {
    console.info(`===> resolving config`);
    await this.groupConfig.init();

    this.props.resolve();
  }


  async installDevModules() {
    console.info(`===> Install npm modules`);
    // TODO: в dev режиме делается npm i в папку с x86 или rpi
  }

  async installProdModules() {
    console.info(`===> Install npm modules`);
    // TODO: в прод режиме делается npm i в папку devs в envset папке
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
      machine: this.machine,
    };

    // build config and entities
    await this.buildEnvSet(initialHostConfig);
    // build devs
    await this.buildHostDevs(initialHostConfig);
  }

  async buildDevelopEnvSet() {
    // TODO: сбилдить конфиги хоста где указанны пути к реальному главному ts файлу
  }

  async startProdSystem() {
    console.info(`===> making platform's dev set`);

    const devSet: {[index: string]: DevClass} = await this.devSet.makeProdDevSet();
    const pathToSystem = path.join(this.getPathToProdSystemDir(), systemClassFileName);
    const System = require(pathToSystem).default;
    const system = new System(devSet);

    return system.start();
  }

  async startDevelopSystem() {
    console.info(`===> making platform's dev set`);

    const devSet: {[index: string]: DevClass} = await this.devSet.makeDevelopDevSet();
    const System = require(`../../system`).default;
    const system = new System(devSet);

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
    const buildDir = path.join(this.props.workDir, BUILD_DEVS_DIR);
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

//const initalHostConfigPath = '../../shared/initialHostConfig.yaml';
// const initialHostConfigPath: string = path.resolve(__dirname, initalHostConfigPath);
// const initialHostConfig: PreHostConfig = await this.io.loadYamlFile(initialHostConfigPath);
// initialHostConfig.platform = this.props.platform;
// initialHostConfig.machine = this.props.machine;
