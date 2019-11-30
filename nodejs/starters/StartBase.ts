import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import Platforms from '../../system/interfaces/Platforms';
import systemConfig from '../../system/systemConfig';
import HostConfig from '../../system/interfaces/HostConfig';
import Main from '../../system/Main';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import {ENV_BUILD_TMP_DIR} from '../../shared/constants';
import Props from './Props';
import Starter from '../interfaces/Starter';
import StarterProps from '../interfaces/StarterProps';


// TODO: review. prod же тоже может быть
const DEV_BUILD_ROOT = 'dev';


export default abstract class StartBase implements Starter {
  protected readonly os: Os = new Os();
  protected readonly groupConfig: GroupConfigParser;
  protected readonly props: Props;
  protected main?: Main;
  protected get envBuilder(): EnvBuilder {
    return this._envBuilder as any;
  }

  private _envBuilder?: EnvBuilder;

  /**
   * Prepare ioSet here.
   */
  protected abstract async makeIoSet(): Promise<IoSet>;


  constructor(configPath: string, starterProps: StarterProps) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      DEV_BUILD_ROOT,
      starterProps.force,
      starterProps.logLevel,
      starterProps.machine,
      starterProps.hostName,
      starterProps.workDir,
      starterProps.user,
      starterProps.group,
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

    const appEnvSetDir = path.join(this.props.appWorkDir, systemConfig.rootDirs.envSet);
    const envSetTmpDir = path.join(this.props.buildWorkDir, ENV_BUILD_TMP_DIR);
    const {platform, machine} = this.resolvePlatformMachine();

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

  destroy = async () => {
    if (!this.main) throw new Error(`Main hasn't been initialized yet`);

    await this.main.destroy();
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

  protected async startMain(
    MainClass: new (ioSet: IoSet) => Main,
    ioSet: IoSet,
    ioServerMode?: boolean,
    lockIoServer?: boolean
  ): Promise<Main> {
    const main: Main = new MainClass(ioSet);
    const hostConfigOverride: HostConfig = {
      // TODO: resolve appType ???? или он зарезолвится ниже ???
      //appType: 'app',
    } as HostConfig;

    console.info(`===> Starting app`);

    await main.init(hostConfigOverride, this.props.argLogLevel);
    await main.configureIoSet(
      (code: number) => this.os.processExit(code),
      this.props.appWorkDir,
      this.props.uid,
      this.props.gid,
    );
    await main.start(ioServerMode, lockIoServer);

    return main;
  }

}


// /**
//  * Install modules that specified in host config according to platform.
//  * It installs modules into root node_modules dir of squidlet repository.
//  */
// protected async installModules() {
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
