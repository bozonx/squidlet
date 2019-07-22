import * as path from 'path';

import {isEmpty} from '../../system/helpers/lodashLike';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR, SYSTEM_FILE_NAME} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {REPO_ROOT, runCmd, SYSTEM_DIR} from '../../shared/helpers';
import SystemStarter from './SystemStarter';
import {IoSetClass} from '../interfaces/IoSetClass';


export default class StartDevelop {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly argIoset?: string;
  private readonly systemStarter: SystemStarter;
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
    this.systemStarter = new SystemStarter(this.os, this.props);
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
    const ioSet: IoSet = await this.makeIoSet();

    await this.systemStarter.start(pathToSystem, ioSet);
  }


  /**
   * Install modules that specified in host config according to platform.
   * It installs modules into root node_modules dir of squidlet repository.
   */
  private async installModules() {

    // TODO: review
    // TODO: why REPO_ROOT ????

    const dependencies = this.envBuilder.configManager.dependencies;

    if (!dependencies || isEmpty(dependencies)) return;

    const toInstallModules: string[] = [];

    for (let moduleName of Object.keys(dependencies)) {
      if (!this.props.force && await this.os.exists(path.join(REPO_ROOT, 'node_modules', moduleName))) continue;

      toInstallModules.push(`${moduleName}@${dependencies[moduleName]}`);
    }

    if (!toInstallModules.length) return;

    console.info(`===> Installing npm modules`);

    await this.installNpmModules(toInstallModules, REPO_ROOT);
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  private async makeIoSet(): Promise<IoSet> {
    // TODO: review
    const ioSetFile: string = this.resolveIoSetType();
    const ioSetPath = `.${path.sep}${ioSetFile}`;
    const IoSetClass: IoSetClass = this.os.require(ioSetPath).default;

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

  /**
   * If is --ioset parameter defined then remote io set will be used.
   * Otherwise source io set which gets configs and manifests from memory and uses source modules.
   */
  private resolveIoSetType(): string {
    if (this.argIoset) {
      return 'IoSetDevelopRemote';
    }

    return 'IoSetDevelopSource';
  }

  private getPathToProdSystemFile(): string {
    return path.join(SYSTEM_DIR, SYSTEM_FILE_NAME);
  }

  /**
   * Install npm modules into node_modules of repository and don't save them to package.json
   */
  private async installNpmModules(modules: string[] = [], cwd: string) {
    const cmd = `npm install ${modules.join(' ')}`;

    await runCmd(this.os, cmd, cwd);
  }

}
