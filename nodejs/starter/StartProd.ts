import * as path from 'path';

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import systemConfig from '../../system/config/systemConfig';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import NodejsMachines from '../interfaces/NodejsMachines';
import {resolvePlatformDir} from '../../shared/helpers';
import {installNpmModules, makeSystemConfigExtend} from './helpers';
import BuildEnvSet from '../../shared/envSetBuild/BuildEnvSet';
import {SYSTEM_FILE_NAME} from '../../shared/constants';


export default class StartProd {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly buildEnvSet: BuildEnvSet;


  constructor(
    configPath: string,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.buildEnvSet = new BuildEnvSet(this.os);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argMachine,
      argHostName,
      argWorkDir,
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();
    this.buildEnvSet.init(this.props.envSetDir, this.props.tmpDir);

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}"`);
  }


  async start() {
    await this.installModules();
    await this.buildInitialSystem();
    await this.startSystem();
  }


  /**
   * It copies package.json and installs node modules into root of working directory.
   * And it makes link to system in node_modules/system.
   * It installs only if node_modules directory doesn't exist.
   */
  private async installModules() {
    // copy package.json
    const platformDir: string = resolvePlatformDir(this.props.platform);
    const machineDir: string = path.join(platformDir, this.props.machine);

    // do not install node modules if they have been installed previously
    if (await this.os.exists(path.join(this.props.workDir, 'node_modules'))) return;

    await this.os.mkdirP(this.props.workDir);
    await this.os.copyFile(
      path.join(machineDir, 'package.json'),
      path.join(this.props.workDir, 'package.json')
    );

    console.info(`===> Install npm modules`);

    await installNpmModules(this.os, this.props.workDir);

    // make sym link to system
    try {
      await this.os.symlink(
        this.getPathToProdSystemDir(),
        path.join(this.props.workDir, 'node_modules', 'system')
      );
    }
    catch (e) {
      // do nothing
    }
  }

  /**
   * Build system only at first time.
   * It builds to workDir/envset/system
   */
  private async buildInitialSystem() {
    const pathToSystemDir = this.getPathToProdSystemDir();

    // else if it exists - do nothing
    if (await this.os.exists(pathToSystemDir)) return;

    const initialHostConfig: PreHostConfig = {
      // TODO: generate id or special guid
      id: 'initialHost',
      platform: this.props.platform,
      machine: this.props.machine,
    };

    await this.buildEnvSet.buildSystem();
    // build config and entities
    await this.buildEnvSet.buildEnvSet(initialHostConfig);
    // build io
    await this.buildEnvSet.buildIos(this.props.platform, this.props.machine);
  }

  /**
   * Resolve production io set (nodejs-ws or local)
   * and start production version of System.
   */
  private async startSystem() {
    const pathToSystem = path.join(this.getPathToProdSystemDir(), SYSTEM_FILE_NAME);
    const System = require(pathToSystem).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);

    console.info(`===> Starting system`);

    // prod supports only local io set
    const system = new System(undefined, systemConfigExtend);

    return system.start();
  }

  private getPathToProdSystemDir(): string {
    return path.join(this.props.workDir, this.props.envSetDir, systemConfig.envSetDirs.system);
  }

}


//const ioSetType: IoSetTypes = this.resolveIoSetType();
//console.info(`===> using io set "${ioSetType}"`);
//const ioSet: IoSet | undefined = this.makeIoSet(ioSetType);

// /**
//  * Only nodejs-ws or local ioSet types are allowed
//  * If there isn't hostConfig.ioSet or ioSet.type = local it returns undefined.
//  */
// private resolveIoSetType(): IoSetTypes {
//   const ioSetConfig: IoSetConfig | undefined = this.props.hostConfig.ioSet;
//
//   if (!ioSetConfig || ioSetConfig.type === 'local') {
//     return 'local';
//   }
//   else if (ioSetConfig.type !== 'nodejs-ws') {
//     throw new Error(`Unsupported ioSet type: "${ioSetConfig.type}"`);
//   }
//
//   return ioSetConfig.type;
// }

// /**
//  * Make ioSet instance or return undefined if local is used.
//  */
// private makeIoSet(ioSetType: IoSetTypes): IoSet | undefined {
//   if (ioSetType === 'local') return;
//
//   const ResolvedIoSet = resolveIoSetClass(ioSetType);
//
//   return new ResolvedIoSet(_omit(this.props.hostConfig.ioSet, 'type'));
// }

// const devsSet: {[index: string]: new (...params: any[]) => any} = {};
// const envSetDevsDir = path.join(this.props.workDir, BUILD_IO_DIR);
// const machineConfig: MachineConfig = loadMachineConfig(this.props.platform, this.props.machine);
//
// for (let devPath of machineConfig.devs) {
//   const devName: string = parseIoName(devPath);
//   const devFileName: string = `${devName}.js`;
//   const devAbsPath: string = path.join(envSetDevsDir, devFileName);
//
//   devsSet[devName] = require(devAbsPath).default;
// }
//
// return devsSet;
