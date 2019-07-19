import * as path from 'path';

import Os, {SpawnCmdResult} from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import systemConfig from '../../system/config/systemConfig';
import NodejsMachines from '../interfaces/NodejsMachines';
import {HOST_ENVSET_DIR, SYSTEM_FILE_NAME} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import Props from './Props';
import ProdBuild from './ProdBuild';
import SystemStarter from './SystemStarter';
import {isEmpty} from '../../system/helpers/lodashLike';
import {runCmd} from '../../shared/helpers';


export default class StartProd {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly prodBuild: ProdBuild;
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
    argWorkDir?: string
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argForce,
      argMachine,
      argHostName,
      argWorkDir,
    );
    this.prodBuild = new ProdBuild(this.os, this.props);
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
    await this.installModules();

    //if (!this.props.force && await this.os.exists(prodSystemDirPath)) return;
    await this.prodBuild.buildInitialSystem();
    // build config and entities
    await this.envBuilder.writeEnv();
    // build io
    await this.prodBuild.buildIos();

    const pathToSystem = path.join(this.getPathToProdSystemDir(), SYSTEM_FILE_NAME);

    await this.systemStarter.start(pathToSystem);
  }


  /**
   * It builds package.json and installs node modules into root of working directory.
   * And it makes link to system in node_modules/system.
   * It installs only if node_modules directory doesn't exist it force parameter isn't set.
   */
  private async installModules() {
    // do not install node modules if they have been installed previously
    if (!this.props.force && await this.os.exists(this.getNodeModulesDir())) {
      console.info(`Directory node_modules exists. It doesn't need to run npm install`);

      return;
    }

    console.info(`===> writing package.json`);

    await this.prodBuild.buildPackageJson(this.envBuilder.configManager.dependencies);

    console.info(`===> Installing npm modules`);

    if (!isEmpty(this.envBuilder.configManager.dependencies)) {
      await this.runNpmInstall();
    }

    await this.makeSystemSymLink();
  }

  private async makeSystemSymLink() {
    const nodeModulesDir = this.getNodeModulesDir();
    const symLinkDst = path.join(nodeModulesDir, 'system');

    console.info(`===> Making symlink from "${this.getPathToProdSystemDir()}" to "${symLinkDst}"`);

    await this.os.mkdirP(nodeModulesDir);

    try {
      await this.os.symlink(
        this.getPathToProdSystemDir(),
        symLinkDst
      );
    }
    catch (e) {
      // do nothing - link exists
    }
  }

  private getPathToProdSystemDir(): string {
    return path.join(this.props.envSetDir, systemConfig.envSetDirs.system);
  }

  private getNodeModulesDir(): string {
    return path.join(this.props.workDir, 'node_modules');
  }

  private async runNpmInstall() {
    await runCmd(this.os, `npm install`, this.props.workDir);
  }

}
