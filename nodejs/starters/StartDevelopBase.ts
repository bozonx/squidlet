import * as path from 'path';

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props, {NoMachine} from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import IoSet from '../../system/interfaces/IoSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import LogLevel from '../../system/interfaces/LogLevel';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import Platforms from '../../system/interfaces/Platforms';
import systemConfig from '../../system/systemConfig';
import {ENV_BUILD_TMP_DIR} from '../../shared/constants';


const DEV_BUILD_ROOT = 'dev';


export default abstract class StartDevelopBase {
  protected  readonly os: Os = new Os();
  protected  readonly groupConfig: GroupConfigParser;
  protected  readonly props: Props;
  private _envBuilder?: EnvBuilder;
  protected get envBuilder(): EnvBuilder {
    return this._envBuilder as any;
  }

  /**
   * Prepare ioSet here.
   */
  protected abstract async makeIoSet(): Promise<IoSet>;


  constructor(
    configPath: string,
    argForce?: boolean,
    argLogLevel?: LogLevel,
    argMachine?: NodejsMachines | NoMachine,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      DEV_BUILD_ROOT,
      argForce,
      argLogLevel,
      argMachine,
      argHostName,
      argWorkDir,
      argUser,
      argGroup,
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

    const appEnvSetDir = path.join(this.props.appWorkDir, systemConfig.rootDirs.envSet);
    const envSetTmpDir = path.join(this.props.buildWorkDir, ENV_BUILD_TMP_DIR);
    const {platform, machine} = this.resolvePlatformMachine();

    await this.os.mkdirP(this.props.appWorkDir, { uid: this.props.uid, gid: this.props.gid });
    //await this.os.mkdirP(appEnvSetDir, { uid: this.props.uid, gid: this.props.gid });
    //await this.os.mkdirP(envSetTmpDir, { uid: this.props.uid, gid: this.props.gid });

    this._envBuilder = new EnvBuilder(
      this.resolveHostConfig(),
      appEnvSetDir,
      envSetTmpDir,
      platform,
      machine,
      { uid: this.props.uid, gid: this.props.gid }
    );
  }


  async start() {
    console.info(`===> collect env set`);
    await this.envBuilder.collect();
  }


  protected resolveHostConfig(): PreHostConfig {
    return this.props.hostConfig;
  }

  protected resolvePlatformMachine(): {platform: Platforms, machine: string} {
    if (!this.props.machine) {
      throw new Error(`No defined machine`);
    }

    return {
      platform: this.props.platform,
      machine: this.props.machine,
    };
  }

}


// /**
//  * Install modules that specified in host config according to platform.
//  * It installs modules into root node_modules dir of squidlet repository.
//  */
// protected async installModules() {
//
//   // TODO: review
//   // TODO: why REPO_ROOT ????
//
//   const dependencies = this.envBuilder.configManager.dependencies;
//
//   if (!dependencies || isEmptyObject(dependencies)) return;
//
//   const toInstallModules: string[] = [];
//
//   for (let moduleName of Object.keys(dependencies)) {
//     if (!this.props.force && await this.os.exists(path.join(REPO_ROOT, 'node_modules', moduleName))) continue;
//
//     toInstallModules.push(`${moduleName}@${dependencies[moduleName]}`);
//   }
//
//   if (!toInstallModules.length) return;
//
//   console.info(`===> Installing npm modules`);
//
//   await this.installNpmModules(toInstallModules, REPO_ROOT);
// }
//
// /**
//  * Install npm modules into node_modules of repository and don't save them to package.json
//  */
// protected async installNpmModules(modules: string[] = [], cwd: string) {
//   const cmd = `npm install ${modules.join(' ')}`;
//
//   const result: SpawnCmdResult = await this.os.spawnCmd(cmd, cwd, {
//     uid: this.props.uid,
//     gid: this.props.gid,
//   });
//
//   if (result.status) {
//     console.error(`ERROR: npm ends with code ${result.status}`);
//     console.error(result.stdout);
//     console.error(result.stderr);
//   }
// }
