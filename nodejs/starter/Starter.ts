import * as path from 'path';
import _trim = require('lodash/trim');

import Io, {SpawnCmdResult} from '../../shared/Io';
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


// interface StarterArgs {
//   configPath: string;
//   workDir?: string;
//   hostName?: string;
// }


const systemClassFileName = 'System';


export default class Starter {
  private readonly io: Io = new Io();
  private readonly machine: string;
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly devSet: DevsSet;


  constructor(configPath: string, machine?: string, hostName?: string, workDir?: string) {
    this.machine = machine;
    this.groupConfig = new GroupConfigParser(this.io, configPath);
    this.props = new Props(this.groupConfig, hostName, workDir);
    this.devSet = new DevsSet(this.io, this.props.platform, this.machine, this.props.workDir);
  }

  async init() {
    await this.groupConfig.init();

    this.props.resolve();

    // TODO: remove
    throw new Error('999999999999999');

    console.info(`Using working dir ${this.props.workDir}`);
    console.info(`Using host ${this.props.hostConfig.id}`);
  }


  async startDev() {
    await this.buildDevelopEnvSet();
    await this.installDevModules();
    await this.startDevelopSystem();
  }

  async startProd() {
    await this.buildInitialProdSystem();
    await this.installProdModules();
    await this.startProdSystem();
  }


  private async installDevModules() {
    console.info(`===> Install npm modules`);
    // TODO: в dev режиме делается npm i в папку с x86 или rpi
  }

  private async installProdModules() {
    console.info(`===> Install npm modules`);
    // TODO: в прод режиме делается npm i в папку devs в envset папке
  }

  private async buildInitialProdSystem() {
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

  private async buildDevelopEnvSet() {
    // TODO: сбилдить конфиги хоста где указанны пути к реальному главному ts файлу
  }

  private async startProdSystem() {
    console.info(`===> making platform's dev set`);

    const devSet: {[index: string]: DevClass} = await this.devSet.makeProdDevSet();
    const pathToSystem = path.join(this.getPathToProdSystemDir(), systemClassFileName);
    const System = require(pathToSystem).default;
    const system = new System(devSet);

    return system.start();
  }

  private async startDevelopSystem() {
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

  private async resolveMachine(): Promise<string> {
    if (this.args.machine) return this.args.machine;

    const spawnResult: SpawnCmdResult = await this.io.spawnCmd('hostnamectl');

    if (spawnResult.status !== 0) {
      throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
    }

    const {os, arch} = this.parseHostNameCtlResult(spawnResult.stdout.join('\n'));

    if (arch.match(/x86/)) {
      // no matter which OS and 32 or 64 bits
      return 'x86';
    }
    else if (arch === 'arm') {
      // TODO: use cpuinfo to resolve Revision or other method
      if (os.match(/Raspbian/)) {
        return 'rpi';
      }
      else {
        return 'arm';
      }
    }

    throw new Error(`Unsupported architecture "${arch}"`);
  }

  private parseHostNameCtlResult(stdout: string): {os: string, arch: string} {
    const osMatch = stdout.match(/Operating System:\s*(.+)$/m);
    const architectureMatch = stdout.match(/Architecture:\s*([\w\d\-]+)/);

    if (!osMatch) {
      throw new Error(`Can't resolve an operating system of the machine`);
    }
    else if (!architectureMatch) {
      throw new Error(`Can't resolve an architecture of the machine`);
    }

    return {
      os: _trim(osMatch[1]),
      arch: architectureMatch[1],
    };
  }

}

//const initalHostConfigPath = '../../shared/initialHostConfig.yaml';
// const initialHostConfigPath: string = path.resolve(__dirname, initalHostConfigPath);
// const initialHostConfig: PreHostConfig = await this.io.loadYamlFile(initialHostConfigPath);
// initialHostConfig.platform = this.props.platform;
// initialHostConfig.machine = this.props.machine;
