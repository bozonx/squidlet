import * as path from 'path';
import * as yargs from 'yargs';

import GroupConfigParser from './GroupConfigParser';


const hostsDir = 'hosts';
const hostDistDir = 'hostDist';


interface ArgsDirs {
  buildDir: string | undefined;
  tmpDir: string | undefined;
}


export default class ResolveDirs {
  buildDir: string = '';
  tmpDir: string = '';
  hostDistBuildDir: string = '';
  hostDistTmpDir: string = '';
  hostsEnvBuildDir: string = '';
  hostsEnvTmpDir: string = '';

  resolve(groupConfig: GroupConfigParser) {
    const args: ArgsDirs = this.resolveArgs();
    const configBase: string = path.dirname(groupConfig.groupConfigPath);
    const buildDir: string | undefined = this.resolvePath(configBase, groupConfig.buildDir, args.buildDir);
    let tmpDir: string | undefined = this.resolvePath(configBase, groupConfig.tmpDir, args.tmpDir);

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


  private resolveArgs(): ArgsDirs {
    const args: ArgsDirs = {
      buildDir: process.env.BUILD_DIR || <string | undefined>yargs.argv['build-dir'],
      tmpDir: process.env.TMP_DIR || <string | undefined>yargs.argv['tmp-dir'],
    };

    // resolve relative buildDir
    if (args.buildDir) args.buildDir = path.resolve(process.cwd(), args.buildDir);
    // resolve relative tmpDir
    if (args.tmpDir) args.tmpDir = path.resolve(process.cwd(), args.tmpDir);

    return args;
  }

  private resolvePath(configBase: string, pathInConfig?: string, argPath?: string): string | undefined {
    if (pathInConfig) {
      return path.resolve(configBase, pathInConfig);
    }

    return argPath;
  }

}
