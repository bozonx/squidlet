import * as path from 'path';

import GroupConfigParser from './GroupConfigParser';


const hostsDir = 'hosts';
const hostDistDir = 'hostDist';


export default class ResolveDirs {
  buildDir: string = '';
  tmpDir: string = '';
  hostDistBuildDir: string = '';
  hostDistTmpDir: string = '';
  hostsEnvBuildDir: string = '';
  hostsEnvTmpDir: string = '';

  resolve(groupConfig: GroupConfigParser, argBuildDir?: string, argTmpDir?: string) {
    const configBase: string = path.dirname(groupConfig.groupConfigPath);
    const buildDir: string | undefined = this.resolvePath(configBase, groupConfig.buildDir, argBuildDir);
    let tmpDir: string | undefined = this.resolvePath(configBase, groupConfig.tmpDir, argTmpDir);

    if (!buildDir) {
      throw new Error(`You have to specify a buildDir in group config or as a command argument or environment variable`);
    }

    // set tmp dir by default
    if (!tmpDir) tmpDir = path.join(buildDir, '__tmp');

    this.buildDir = buildDir;
    this.tmpDir = tmpDir;
    this.hostDistBuildDir = path.join(this.buildDir, hostDistDir);
    this.hostDistTmpDir = path.join(this.tmpDir, hostDistDir);
    this.hostsEnvBuildDir = path.join(this.buildDir, hostsDir);
    this.hostsEnvTmpDir = path.join(this.tmpDir, hostsDir);
  }

  private resolvePath(configBase: string, pathInConfig?: string, argPath?: string): string | undefined {
    if (pathInConfig) {
      return path.resolve(configBase, pathInConfig);
    }

    return argPath;
  }

}
