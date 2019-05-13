import * as path from 'path';
import {BUILD_IO_DIR, BUILD_SYSTEM_DIR, HOST_ENVSET_DIR} from '../constants';
import BuildSystem from './BuildSystem';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import BuildHostEnv from './BuildHostEnv';
import BuildIo from './BuildIo';
import systemConfig from '../../system/config/systemConfig';
import Os from '../Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';


export default class BuildEnvSet {
  private envSetDir: string = '';
  private tmpDir: string = '';
  private readonly os: Os;


  constructor(os: Os) {
    this.os = os;
  }


  init(envSetDir: string, tmpDir: string) {
    this.envSetDir = envSetDir;
    this.tmpDir = tmpDir;
  }


  /**
   * Build system to workDir/envset/system
   */
  async buildSystem() {
    const systemBuildDir = path.join(this.envSetDir, systemConfig.envSetDirs.system);
    const systemTmpDir = path.join(this.tmpDir, BUILD_SYSTEM_DIR);
    const buildSystem: BuildSystem = new BuildSystem(this.os);

    console.info(`===> Building system`);
    await buildSystem.build(systemBuildDir, systemTmpDir);
  }

  /**
   * Build workDir/configs and workDir/entities
   */
  async buildEnvSet(hostConfig: PreHostConfig) {
    const tmpDir = path.join(this.tmpDir, HOST_ENVSET_DIR);
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.os,
      hostConfig,
      this.envSetDir,
      tmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();
  }

  /**
   * Build io files to workDir/io
   */
  async buildIos(platform: Platforms, machine: string) {
    console.info(`===> Building io`);

    const buildDir = path.join(this.envSetDir, BUILD_IO_DIR);
    const tmpDir = path.join(this.tmpDir, BUILD_IO_DIR);
    const buildIo: BuildIo = new BuildIo(
      this.os,
      platform,
      machine,
      buildDir,
      tmpDir
    );

    await buildIo.build();
  }

}
