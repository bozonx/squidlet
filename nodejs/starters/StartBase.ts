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
import {APP_WORK_DIR, BUILD_WORK_DIR, ENV_BUILD_TMP_DIR, REPO_BUILD_DIR} from '../../shared/constants';
import Starter from '../interfaces/Starter';
import StarterProps from '../interfaces/StarterProps';
import {LOG_LEVELS} from '../../system/interfaces/LogLevel';
import NodejsMachines, {nodejsSupportedMachines} from '../interfaces/NodejsMachines';
import {REPO_ROOT} from '../../shared/helpers/helpers';
import {getOsMachine} from '../../shared/helpers/resolveMachine';
import {resolveUid, resolveGid} from '../../shared/helpers/resolveUserGroup';


// TODO: maybe remove and use false instead of it
export type NoMachine = 'noMachine';


export default abstract class StartBase implements Starter {
  protected abstract buildRoot: string;

  protected readonly os: Os = new Os();
  protected readonly groupConfig: GroupConfigParser;
  protected readonly starterProps: StarterProps;
  protected main?: Main;
  protected appWorkDir: string = '';
  protected buildWorkDir: string = '';
  protected uid?: number;
  protected gid?: number;
  protected platform: Platforms = 'nodejs';
  protected machine?: NodejsMachines;

  protected get envBuilder(): EnvBuilder {
    return this._envBuilder as any;
  }

  protected get hostConfig(): PreHostConfig {
    return this.groupConfig.getHostConfig(this.starterProps.hostName);
  }
  protected get hostId(): string {
    return this.hostConfig.id as any;
  }

  private _envBuilder?: EnvBuilder;

  /**
   * Prepare ioSet here.
   */
  protected abstract async makeIoSet(): Promise<IoSet>;


  constructor(configPath: string, starterProps: StarterProps) {
    this.starterProps = starterProps;
    this.groupConfig = new GroupConfigParser(this.os, configPath);

    this.validate();
  }

  async init() {
    await this.groupConfig.init();

    this.machine = await this.resolveMachine();
    this.buildWorkDir = this.resolveBuildWorkDir();
    this.appWorkDir = this.resolveAppWorkDir();
    this.uid = await this.resolveUid();
    this.gid = await this.resolveGid();

    const appEnvSetDir = path.join(this.appWorkDir, systemConfig.rootDirs.envSet);
    const envSetTmpDir = path.join(this.buildWorkDir, ENV_BUILD_TMP_DIR);
    const {platform, machine} = this.resolvePlatformMachine();

    this._envBuilder = new EnvBuilder(
      this.resolveHostConfig(),
      appEnvSetDir,
      envSetTmpDir,
      platform,
      machine,
      { uid: this.uid, gid: this.gid }
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
    return this.hostConfig;
  }

  protected resolvePlatformMachine(): {platform: Platforms, machine: string} {
    if (!this.machine) {
      throw new Error(`No defined machine`);
    }

    return {
      platform: this.platform,
      machine: this.machine,
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

    await main.init(hostConfigOverride, this.starterProps.logLevel);
    await main.configureIoSet(
      (code: number) => this.os.processExit(code),
      this.appWorkDir,
      this.uid,
      this.gid,
    );
    await main.start(ioServerMode, lockIoServer);

    return main;
  }

  private validate() {
    if (this.starterProps.group && !this.starterProps.user) {
      throw new Error(`The "--user" param hasn't been set`);
    }

    if (this.starterProps.logLevel && !LOG_LEVELS.includes(this.starterProps.logLevel)) {
      throw new Error(`Invalid "log-level" param: ${this.starterProps.logLevel}`);
    }
  }

  private async resolveMachine(): Promise<NodejsMachines | undefined> {
    if (this.starterProps.machine === 'noMachine') return;

    if (this.starterProps.machine) {
      if (!nodejsSupportedMachines.includes(this.starterProps.machine)) {
        throw new Error(`Unsupported machine type "${this.starterProps.machine}"`);
      }

      return this.starterProps.machine;
    }

    return this.getOsMachine();
  }

  private resolveAppWorkDir(): string {
    if (this.starterProps.workDir) {
      // if it set as an argument - make it absolute
      return path.resolve(process.cwd(), this.starterProps.workDir);
    }

    return path.join(
      REPO_ROOT,
      REPO_BUILD_DIR,
      this.buildRoot,
      this.hostId,
      APP_WORK_DIR
    );
  }

  protected resolveBuildWorkDir(): string {
    return path.join(
      REPO_ROOT,
      REPO_BUILD_DIR,
      this.buildRoot,
      this.hostId,
      BUILD_WORK_DIR
    );
  }

  private getOsMachine(): Promise<NodejsMachines> {
    return getOsMachine(this.os);
  }

  private resolveUid(): Promise<number | undefined> {
    return resolveUid(this.os, this.starterProps.user);
  }

  private resolveGid(): Promise<number | undefined> {
    return resolveGid(this.os, this.starterProps.group);
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
