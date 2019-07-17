import * as path from 'path';
import _isEmpty = require('lodash/isEmpty');

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import {installNpmModules, startSystem, SystemClassType} from './helpers';
import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR, SYSTEM_FILE_NAME} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import {REPO_ROOT, SYSTEM_DIR} from '../../shared/helpers';


type IoSetClass = new (os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string, paramsString?: string) => IoSet;


export default class StartDevelop {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly argIoset?: string;
  private _envBuilder?: EnvBuilder;
  private get envBuilder(): EnvBuilder {
    return this._envBuilder as any;
  }


  constructor(
    configPath: string,
    argForce: boolean,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argIoset?: string,
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.argIoset = argIoset;
    this.props = new Props(
      this.os,
      this.groupConfig,
      argForce,
      argMachine,
      argHostName,
      argWorkDir
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);

    this._envBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    await this.os.mkdirP(this.props.varDataDir);
    await this.os.mkdirP(this.props.envSetDir);
    await this.installModules();

    const pathToSystem = this.getPathToProdSystemFile();
    const SystemClass = this.requireSystemClass(pathToSystem);
    const ioSet: IoSet = await this.makeIoSet();

    await this.startSystem(SystemClass, ioSet);
  }


  private async installModules() {
    const dependencies = this.envBuilder.configManager.dependencies;

    if (!dependencies || _isEmpty(dependencies)) return;

    const toInstallModules: string[] = [];

    for (let moduleName of Object.keys(dependencies)) {
      if (!this.props.force && await this.os.exists(path.join(REPO_ROOT, 'node_modules', moduleName))) continue;

      toInstallModules.push(`${moduleName}@${dependencies[moduleName]}`);
    }

    if (!toInstallModules.length) return;

    console.info(`===> Installing npm modules`);

    await installNpmModules(this.os, REPO_ROOT, toInstallModules);
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  private async makeIoSet(): Promise<IoSet> {
    const ioSetFile: string = this.resolveIoSetType();
    const ioSetPath = `.${path.sep}${ioSetFile}`;
    const IoSetClass: IoSetClass = require(ioSetPath).default;

    console.info(`using io set "${ioSetFile}"`);

    const ioSet = new IoSetClass(
      this.os,
      this.envBuilder,
      this.props.envSetDir,
      this.props.platform,
      this.props.machine,
      this.argIoset
    );

    ioSet.prepare && await ioSet.prepare();

    return ioSet;
  }

  private resolveIoSetType(): string {
    if (this.argIoset) {
      return 'IoSetDevelopRemote';
    }

    return 'IoSetDevelopLocal';
  }

  private getPathToProdSystemFile(): string {
    return path.join(SYSTEM_DIR, SYSTEM_FILE_NAME);
  }

  /**
   * Wrapper for test purpose
   */
  private requireSystemClass(pathToSystem: string): SystemClassType {
    return require(pathToSystem).default;
  }

  /**
   * Wrapper for test purpose
   */
  private async startSystem(SystemClass: SystemClassType, ioSet: IoSet) {
    await startSystem(this.props, SystemClass, ioSet);
  }
}
