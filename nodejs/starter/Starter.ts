import * as path from 'path';

import Io from '../../hostEnvBuilder/Io';
import ResolveArgs from './ResolveArgs';
import GroupConfigParser from '../../control/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import systemConfig from '../../host/config/systemConfig';


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

    if (!await this.io.exists(pathToSystemDir)) {
      // TODO: билд system
      // TODO: билд env set с конфигом по умолчанию
    }

    // else if it exists - do nothing
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
    return path.join(this.props.workDir, systemConfig.rootDirs.host);
  }

}
