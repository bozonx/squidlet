import * as path from 'path';

import Io from '../../hostEnvBuilder/Io';
import ResolveArgs from './ResolveArgs';
import GroupConfigParser from '../../control/GroupConfigParser';
import Props from './Props';
import DevsSet from './DevsSet';
import systemConfig from '../../host/config/systemConfig';


export default class Starter {
  private readonly io: Io = new Io();
  private readonly args: ResolveArgs;
  private readonly groupConfig: GroupConfigParser = new GroupConfigParser(this.io, this.params.configPath);
  private readonly props: Props = new Props(this.args, this.groupConfig);
  private readonly devSet: DevsSet = new DevsSet();


  constructor(args: ResolveArgs) {
    this.args = args;
  }

  async init() {
    console.info(`===> resolving config`);
    await this.groupConfig.init();

    this.props.resolve();

    console.info(`===> making platform's dev set`);
    this.devSet.collect();
  }


  async installModules() {
    console.info(`===> Install npm modules`);
    // TODO: делается npm i в папку с devs если нужно
  }

  async buildInitialProdSystem() {
    // TODO: если нету system - то билдится он и env set с конфигом по умолчанию
  }

  async buildDevelopEnvSet() {
    // TODO: сбилдить конфиги хоста где указанны пути к реальному главному ts файлу
  }

  async startProdSystem() {
    const pathToSystem = path.join(this.props.workDir, systemConfig.rootDirs.host, 'System');
    const System = require(pathToSystem).default;
    const system = new System(this.devSet.devSet);

    return system.start();
  }

  async startDevelopSystem() {
    const System = require(`../../host/System`).default;
    const system = new System(this.devSet.devSet);

    return system.start();
  }

}