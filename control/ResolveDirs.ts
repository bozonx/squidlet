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


// private resolveWorkDir(): string {
//   let workDirArg: string | undefined = this.args.workDir;
//
//   // if (workDirArg) {
//   //   // if it set as an argument - make it absolute
//   //   return path.resolve(process.cwd(), workDirArg);
//   // }
//
//   // or make default path using $SQUIDLET_ROOT
//   const squidletRoot: string = resolveSquidletRoot();
//
//   return path.join(squidletRoot, BUILD_ROOT_DIR);
// }
//

// interface ArgsDirs {
//   buildDir: string | undefined;
//   tmpDir: string | undefined;
// }

// private resolvePath(configBase: string, pathInConfig?: string, argPath?: string): string | undefined {
//   if (pathInConfig) {
//     return path.resolve(configBase, pathInConfig);
//   }
//
//   return argPath;
// }

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
