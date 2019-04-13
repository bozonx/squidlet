import * as path from 'path';
import * as yargs from 'yargs';

import GroupConfigParser from './GroupConfigParser';
import {BUILD_HOSTS_DIR, BUILD_ROOT_DIR, BUILD_SYSTEM_DIR} from './constants';
import {resolveSquidletRoot} from './helpers';


interface ArgsDirs {
  buildDir: string | undefined;
  tmpDir: string | undefined;
}


export default class ResolveDirs {
  workDir: string = '';
  tmpDir: string = '';
  systemBuildDir: string = '';
  systemTmpDir: string = '';
  hostsBuildDir: string = '';
  hostsTmpDir: string = '';

  resolve() {
    this.workDir = this.resolveWorkDir();
    this.tmpDir = path.join(this.workDir, '__tmp');
    this.systemBuildDir = path.join(this.workDir, BUILD_SYSTEM_DIR);
    this.systemTmpDir = path.join(this.tmpDir, BUILD_SYSTEM_DIR);
    this.hostsBuildDir = path.join(this.workDir, BUILD_HOSTS_DIR);
    this.hostsTmpDir = path.join(this.tmpDir, BUILD_HOSTS_DIR);
  }


  private resolveWorkDir(): string {
    let workDirArg: string | undefined = <string | undefined>yargs.argv['build-dir'];

    if (workDirArg) {
      // if it set as an argument - make it absolute
      return path.resolve(process.cwd(), workDirArg);
    }

    // or make default path using $SQUIDLET_ROOT
    const squidletRoot: string = resolveSquidletRoot();

    return path.join(squidletRoot, BUILD_ROOT_DIR);
  }

  private resolvePath(configBase: string, pathInConfig?: string, argPath?: string): string | undefined {
    if (pathInConfig) {
      return path.resolve(configBase, pathInConfig);
    }

    return argPath;
  }

}



// const configBase: string = path.dirname(groupConfig.groupConfigPath);
// const buildDir: string | undefined = this.resolvePath(configBase, groupConfig.buildDir, args.buildDir);
// if (!buildDir) {
//   throw new Error(`You have to specify a buildDir in group config or as a command argument or environment variable`);
// }
// private resolveArgs(): ArgsDirs {
//   const args: ArgsDirs = {
//     buildDir: process.env.BUILD_DIR || <string | undefined>yargs.argv['build-dir'],
//     tmpDir: process.env.TMP_DIR || <string | undefined>yargs.argv['tmp-dir'],
//   };
//
//   // resolve relative buildDir
//   if (args.buildDir) args.buildDir = path.resolve(process.cwd(), args.buildDir);
//   // resolve relative tmpDir
//   if (args.tmpDir) args.tmpDir = path.resolve(process.cwd(), args.tmpDir);
//
//   return args;
// }
