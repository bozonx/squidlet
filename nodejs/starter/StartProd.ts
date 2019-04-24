import * as path from 'path';
import _omit = require('lodash/omit');

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import systemConfig from '../../system/config/systemConfig';
import BuildSystem from '../../shared/BuildSystem';
import {
  BUILD_IO_DIR,
  BUILD_SYSTEM_DIR,
  HOST_ENVSET_DIR,
} from '../../shared/constants';
import PreHostConfig, {IoSetConfig} from '../../hostEnvBuilder/interfaces/PreHostConfig';
import BuildHostEnv from '../../shared/BuildHostEnv';
import BuildIo from '../../shared/BuildIo';
import NodejsMachines from '../interfaces/NodejsMachines';
import {resolveIoSetClass, resolvePlatformDir} from '../../shared/helpers';
import {installNpmModules, makeSystemConfigExtend} from './helpers';
import IoSet from '../../system/interfaces/IoSet';
import IoSetTypes from '../../hostEnvBuilder/interfaces/IoSetTypes';


const systemClassFileName = 'System';


export default class StartProd {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;


  constructor(
    configPath: string,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argIoset?: string,
    argIosetProps?: string
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argMachine,
      argHostName,
      argWorkDir,
      argIoset,
      argIosetProps
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

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
   * Build system first time.
   */
  private async buildInitialSystem() {
    const pathToSystemDir = this.getPathToProdSystemDir();

    // else if it exists - do nothing
    if (await this.os.exists(pathToSystemDir)) return;

    await this.buildSystem();

    const initialHostConfig: PreHostConfig = {
      // TODO: generate id or special guid
      id: 'initialHost',
      platform: this.props.platform,
      machine: this.props.machine,
    };

    // build config and entities
    await this.buildEnvSet(initialHostConfig);
    // build io
    await this.buildIos();
  }

  /**
   * Resolve production io set (nodejs-ws or local)
   * and start production version of System.
   */
  private async startSystem() {
    const pathToSystem = path.join(this.getPathToProdSystemDir(), systemClassFileName);
    const System = require(pathToSystem).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);
    const ioSet: IoSet | undefined = this.resolveIoSet();

    console.info(`===> Starting system`);

    const system = new System(ioSet, systemConfigExtend);

    return system.start();
  }

  private resolveIoSet(): IoSet | undefined {
    const ioSetConfig: IoSetConfig | undefined = this.props.hostConfig.ioSet;
    // use specified type or 'local' by default
    const ioType: IoSetTypes = (ioSetConfig) ? ioSetConfig.type : 'local';

    console.info(`===> using io set "${ioType}"`);

    // only nodejs-ws or local ioSet types are allowed
    // ioType local means ioSet = undefined
    if (ioType === 'nodejs-ws') {
      const ResolvedIoSet = resolveIoSetClass(ioType);

      return new ResolvedIoSet(_omit(ioSetConfig, 'type'));
    }
    else if (ioType !== 'local') {
      throw new Error(`Unsupported ioSet type: "${ioType}"`);
    }

    return;
  }

  /**
   * Build system to workDir/system
   */
  private async buildSystem() {
    const systemBuildDir = this.getPathToProdSystemDir();
    const systemTmpDir = path.join(this.props.tmpDir, BUILD_SYSTEM_DIR);
    const buildSystem: BuildSystem = new BuildSystem(this.os);

    console.info(`===> Building system`);
    await buildSystem.build(systemBuildDir, systemTmpDir);
  }

  /**
   * Build workDir/configs and workDir/entities
   */
  private async buildEnvSet(hostConfig: PreHostConfig) {
    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.os,
      hostConfig,
      this.props.envSetDir,
      tmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();
  }

  /**
   * Build io files to workDir/io
   */
  private async buildIos() {
    console.info(`===> Building io`);

    const buildDir = path.join(this.props.envSetDir, BUILD_IO_DIR);
    const tmpDir = path.join(this.props.tmpDir, BUILD_IO_DIR);
    const buildIo: BuildIo = new BuildIo(
      this.os,
      this.props.platform,
      this.props.machine,
      buildDir,
      tmpDir
    );

    await buildIo.build();
  }

  private getPathToProdSystemDir(): string {
    return path.join(this.props.workDir, this.props.envSetDir, systemConfig.envSetDirs.system);
  }

}


// const devsSet: {[index: string]: new (...params: any[]) => any} = {};
// const envSetDevsDir = path.join(this.props.workDir, BUILD_IO_DIR);
// const machineConfig: MachineConfig = loadMachineConfig(this.props.platform, this.props.machine);
//
// for (let devPath of machineConfig.devs) {
//   const devName: string = parseDevName(devPath);
//   const devFileName: string = `${devName}.js`;
//   const devAbsPath: string = path.join(envSetDevsDir, devFileName);
//
//   devsSet[devName] = require(devAbsPath).default;
// }
//
// return devsSet;
