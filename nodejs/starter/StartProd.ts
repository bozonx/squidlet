import * as path from 'path';

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import systemConfig from '../../system/config/systemConfig';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import NodejsMachines from '../interfaces/NodejsMachines';
import {generatePackageJson, installNpmModules, startSystem} from './helpers';
import BuildEnvSet from '../../shared/envSetBuild/BuildEnvSet';
import {SYSTEM_FILE_NAME} from '../../shared/constants';
import {preparePreHostConfig} from '../../shared/helpers';


export default class StartProd {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private _buildEnvSet?: BuildEnvSet;
  private get buildEnvSet(): BuildEnvSet {
    return this._buildEnvSet as any;
  }


  constructor(
    configPath: string,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
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
    this._buildEnvSet = new BuildEnvSet(this.os, this.props.envSetDir, this.props.tmpDir);

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}"`);
  }


  async start() {
    const pathToSystem = path.join(this.getPathToProdSystemDir(), SYSTEM_FILE_NAME);
    const SystemClass = require(pathToSystem).default;

    await this.installModules();
    await this.buildInitialSystem();
    await startSystem(this.props, SystemClass);
  }


  /**
   * It copies package.json and installs node modules into root of working directory.
   * And it makes link to system in node_modules/system.
   * It installs only if node_modules directory doesn't exist.
   */
  private async installModules() {
    // do not install node modules if they have been installed previously
    if (await this.os.exists(path.join(this.props.workDir, 'node_modules'))) return;

    const mergedHostConfig: PreHostConfig = await preparePreHostConfig(this.props.hostConfig);
    const packageJson: string = generatePackageJson(mergedHostConfig.dependencies);

    console.info(`===> writing package.json`);

    await this.os.mkdirP(this.props.workDir);
    await this.os.writeFile(path.join(this.props.workDir, 'package.json'), packageJson);

    console.info(`===> Installing npm modules`);

    await installNpmModules(this.os, this.props.workDir);

    // make sym link to system
    try {
      await this.os.symlink(
        this.getPathToProdSystemDir(),
        path.join(this.props.workDir, 'node_modules', 'system')
      );
    }
    catch (e) {
      // do nothing - link exists
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

  private getPathToProdSystemDir(): string {
    return path.join(this.props.workDir, this.props.envSetDir, systemConfig.envSetDirs.system);
  }

}



//const platformDir: string = resolvePlatformDir(this.props.platform);
//const machineDir: string = path.join(platformDir, this.props.machine);
// await this.os.copyFile(
//   path.join(machineDir, 'package.json'),
//   path.join(this.props.workDir, 'package.json')
// );

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
//   const devName: string = getFileNameOfPath(devPath);
//   const devFileName: string = `${devName}.js`;
//   const devAbsPath: string = path.join(envSetDevsDir, devFileName);
//
//   devsSet[devName] = require(devAbsPath).default;
// }
//
// return devsSet;
