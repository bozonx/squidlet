import * as path from 'path';

import {BUILD_HOSTS_DIR, BUILD_ROOT_DIR} from '../shared/constants';
import {resolveWorkDir} from '../shared/helpers';
import systemConfig from '../system/config/systemConfig';


export interface Args {
  workDir: string;
}


export default class ResolveDirs {
  workDir: string = '';
  tmpDir: string = '';
  systemBuildDir: string = '';
  systemTmpDir: string = '';
  hostsBuildDir: string = '';
  hostsTmpDir: string = '';
  private readonly args: Args;


  constructor(args: Args) {
    this.args = args;
  }


  resolve() {
    this.workDir = resolveWorkDir(BUILD_ROOT_DIR, this.args.workDir);
    this.tmpDir = path.join(this.workDir, '__tmp');
    this.systemBuildDir = path.join(this.workDir, systemConfig.envSetDirs.system);
    this.systemTmpDir = path.join(this.tmpDir, systemConfig.envSetDirs.system);
    this.hostsBuildDir = path.join(this.workDir, BUILD_HOSTS_DIR);
    this.hostsTmpDir = path.join(this.tmpDir, BUILD_HOSTS_DIR);
  }

}
