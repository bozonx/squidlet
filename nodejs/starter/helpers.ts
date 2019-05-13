import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import Os, {SpawnCmdResult} from '../../shared/Os';
import Props from './Props';
import {IoItemClass} from '../../system/interfaces/IoItem';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import * as ts from 'typescript';
import {loadMachineConfigInPlatformDir, parseIoName} from '../../shared/helpers';


//const REPO_ROOT = path.resolve(__dirname, '../');
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
