import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import Os, {SpawnCmdResult} from '../../shared/Os';
import Props from './Props';
import {IoItemClass} from '../../system/interfaces/IoItem';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import * as ts from 'typescript';
import {loadMachineConfigInPlatformDir, parseIoName} from '../../shared/helpers';


export const SYSTEM_DIR = path.resolve(__dirname, '../../system');
export const SYSTEM_FILE_NAME = 'System';


export function makeSystemConfigExtend(props: Props): {[index: string]: any} {
  return {
    rootDirs: {
      envSet: props.envSetDir,
      varData: path.join(props.workDir, HOST_VAR_DATA_DIR),
      tmp: path.join(props.tmpDir, HOST_TMP_HOST_DIR),
    },
  };
}

export async function installNpmModules(os: Os, cwd: string) {
  const result: SpawnCmdResult = await os.spawnCmd('npm install', cwd);

  if (result.status) {
    throw new Error(`Can't install npm modules:\n${result.stderr}`);
  }
}


/**
 * Read machine config and load io which are specified there.
 */
export async function makeDevelopIoCollection(
  os: Os,
  platformDir: string,
  machine: string
): Promise<{[index: string]: IoItemClass}> {
  const ioSet: {[index: string]: new (...params: any[]) => any} = {};
  const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(platformDir, machine);
  const evalModulePath: string = path.join(platformDir, machine, 'evalModule');
  const machineEvalModule: any = require(evalModulePath);

  for (let ioPath of machineConfig.ios) {
    const ioName: string = parseIoName(ioPath);
    const ioAbsPath = path.resolve(platformDir, ioPath);
    const moduleContent: string = await os.getFileContent(ioAbsPath);
    const compiledModuleContent: string = ts.transpile(moduleContent);

    ioSet[ioName] = machineEvalModule(compiledModuleContent);
  }

  return ioSet;
}

// /**
//  * Resolve ioSet file and load it.
//  */
// export function resolveIoSetClass(iosetType: IoSetTypes): IoSet | undefined {
//   let relativeFilePath: string;
//
//   // TODO: why????
//   // prod local
//   if (iosetType === 'local') {
//     return undefined;
//     //relativeFilePath = 'system/ioSet/IoSetLocal';
//   }
//   // // prod nodejs ws
//   // else if (iosetType === 'nodejs-ws') {
//   //   relativeFilePath = 'nodejs/ioSet/IoSetWs';
//   // }
//   else if (iosetType === 'nodejs-developLocal') {
//     relativeFilePath = 'nodejs/ioSet/IoSetDevelopLocal';
//   }
//   else if (iosetType === 'nodejs-developWs') {
//     relativeFilePath = 'nodejs/ioSet/IoSetDevelopWs';
//   }
//   else {
//     throw new Error(`Unsupported type of ioSet "${iosetType}" for nodejs platform`);
//   }
//
//   const ioSetPath = path.join(REPO_ROOT, relativeFilePath);
//
//   return require(ioSetPath).default;
// }
