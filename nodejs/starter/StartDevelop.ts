import * as path from 'path';
import _isEmpty = require('lodash/isEmpty');

import Os, {SpawnCmdResult} from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import {startSystem} from './helpers';
import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR, SYSTEM_FILE_NAME} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import {preparePreHostConfig, REPO_ROOT, SYSTEM_DIR} from '../../shared/helpers';


type IoSetClass = new (os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string, paramsString?: string) => IoSet;

const IOSET_DIR = path.resolve(__dirname, '../ioSet');


export default class StartDevelop {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly argIoset?: string;


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

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}"`);
  }


  async start() {
    const pathToSystem = path.join(SYSTEM_DIR, SYSTEM_FILE_NAME);
    const System = require(pathToSystem).default;
    const ioSet = this.makeIoSet();

    await this.installModules();
    await startSystem(this.props, System, ioSet);
  }


  private async installModules() {
    // TODO: use force to reinstall

    const mergedHostConfig: PreHostConfig = await preparePreHostConfig(this.props.hostConfig);

    if (!mergedHostConfig.dependencies || _isEmpty(this.props.hostConfig.dependencies)) return;

    const toInstallModules: string[] = [];

    for (let moduleName of Object.keys(mergedHostConfig.dependencies)) {
      if (await this.os.exists(path.join(REPO_ROOT, 'node_modules', moduleName))) continue;

      toInstallModules.push(`${moduleName}@${mergedHostConfig.dependencies[moduleName]}`);
    }

    if (!toInstallModules.length) return;

    console.info(`===> Installing npm modules`);

    const cmd = `npm install ${toInstallModules.join(' ')}`;

    // TODO: use installNpmModules function ???

    const result: SpawnCmdResult = await this.os.spawnCmd(cmd, REPO_ROOT);

    if (result.status) {
      console.error(`ERROR: npm ends with code ${result.status}`);
      console.error(result.stdout);
      console.error(result.stderr);
    }
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  private makeIoSet(): IoSet {
    const ioSetFile: string = this.resolveIoSetType();
    const ioSetPath = path.join(IOSET_DIR, ioSetFile);
    const IoSetClass: IoSetClass = require(ioSetPath).default;
    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);

    console.info(`--> using io set "${ioSetFile}"`);

    const ioSet = new IoSetClass(
      this.os,
      envBuilder,
      this.props.envSetDir,
      this.props.platform,
      this.props.machine,
      this.argIoset
    );

    ioSet.prepare && ioSet.prepare();

    return ioSet;
  }

  private resolveIoSetType(): string {
    if (this.argIoset) {
      return 'IoSetDevelopRemote';
    }

    return 'IoSetDevelopLocal';
  }

}


// /**
//  * Only nodejs-developLocal or nodejs-developWs ioSet types are allowed
//  * If there isn't hostConfig.ioSet or ioSet.type = local it returns undefined.
//  */
// private resolveIoSetType(): IoSetTypes {
//
//   // TODO: review
//
//   const ioSetConfig: IoSetConfig | undefined = this.props.hostConfig.ioSet;
//
//   if (!ioSetConfig || ioSetConfig.type === 'nodejs-developLocal') {
//     return 'nodejs-developLocal';
//   }
//   else if (ioSetConfig.type !== 'nodejs-developWs') {
//     throw new Error(`Unsupported ioSet type: "${ioSetConfig.type}"`);
//   }
//
//   return ioSetConfig.type;
// }

// /**
//  * Install node modules into squidlet repository in ./nodejs/<x86|rpi|arm>/ .
//  * It installs only if node_modules directory doesn't exist.
//  */
// private async installModules() {
//
//
//   const platformDir = resolvePlatformDir(this.props.platform);
//   const machineCwd: string = path.join(platformDir, this.props.machine);
//
//   // do not install node modules if they have been installed previously
//   if (await this.os.exists(path.join(machineCwd, 'node_modules'))) return;
//
//   console.info(`===> Install npm modules`);
//
//   await installNpmModules(this.os, machineCwd);
// }
