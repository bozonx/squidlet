import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import Os, {SpawnCmdResult} from '../../shared/Os';
import Props from './Props';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import * as ts from 'typescript';
import {loadMachineConfigInPlatformDir, getFileNameOfPath} from '../../shared/helpers';
import System from '../../system';
import IoSet from '../../system/interfaces/IoSet';


//const REPO_ROOT = path.resolve(__dirname, '../');
export const SYSTEM_DIR = path.resolve(__dirname, '../../system');


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

export async function startSystem(
  props: Props,
  SystemClass: new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System,
  ioSet?: IoSet,
) {
  const systemConfigExtend = makeSystemConfigExtend(props);

  console.info(`===> Initializing system`);

  const system = new SystemClass(ioSet, systemConfigExtend);

  process.on('SIGTERM', () => {
    system.destroy();
  });

  console.info(`===> Starting system`);

  return system.start();
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
