import * as path from 'path';

import Io from '../../hostEnvBuilder/Io';
import ResolveArgs from './ResolveArgs';
import GroupConfigParser from '../../control/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import systemConfig from '../../host/config/systemConfig';
import BuildSystem from '../../control/BuildSystem';
import {BUILD_SYSTEM_DIR} from '../../control/constants';


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


    // TODO: билд env set с конфигом по умолчанию
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

}
