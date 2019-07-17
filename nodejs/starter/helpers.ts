import * as path from 'path';
import * as fs from 'fs';
import _template = require('lodash/template');

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import Os, {SpawnCmdResult} from '../../shared/Os';
import Props from './Props';
import {SQUIDLET_PACKAGE_JSON_PATH} from '../../shared/helpers';
import System from '../../system';
import IoSet from '../../system/interfaces/IoSet';
import {ENCODE} from '../../system/dict/constants';


const PACKAGE_JSON_TEMPLATE_PATH = path.resolve(__dirname, './package.json.template');

export type SystemClassType = new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System;


export function makeSystemConfigExtend(props: Props): {[index: string]: any} {
  return {
    rootDirs: {
      envSet: props.envSetDir,
      varData: path.join(props.workDir, HOST_VAR_DATA_DIR),
      tmp: path.join(props.tmpDir, HOST_TMP_HOST_DIR),
    },
  };
}

export async function installNpmModules(os: Os, cwd: string, modules: string[] = []) {
  const cmd = `npm install ${modules.join(' ')}`;
  const result: SpawnCmdResult = await os.spawnCmd(cmd, cwd);

  if (result.status) {
    console.error(`ERROR: npm ends with code ${result.status}`);
    console.error(result.stdout);
    console.error(result.stderr);
  }
}

export function listenDestroySignals(destroyTimeoutSec: number, destroy: () => Promise<void>) {
  const gracefullyDestroy = async () => {
    setTimeout(() => {
      console.error(`ERROR: App hasn't been gracefully destroyed during "${destroyTimeoutSec}" seconds`);
      process.exit(3);
    }, destroyTimeoutSec * 1000);

    try {
      await destroy();
      process.exit(0);
    }
    catch (err) {
      console.error(err);
      process.exit(2);
    }
  };

  process.on('SIGTERM', gracefullyDestroy);
  process.on('SIGINT', gracefullyDestroy);
}

export async function startSystem(
  props: Props,
  SystemClass: SystemClassType,
  ioSet?: IoSet,
) {
  const systemConfigExtend = makeSystemConfigExtend(props);

  console.info(`===> Initializing system`);

  const system = new SystemClass(ioSet, systemConfigExtend);

  listenDestroySignals(props.destroyTimeoutSec, system.destroy);

  console.info(`===> Starting system`);

  return system.start();
}

export function generatePackageJson(dependencies: {[index: string]: any} = {}): string {
  const templateContent: string = fs.readFileSync(PACKAGE_JSON_TEMPLATE_PATH, ENCODE);
  const squildletPackageJson: {version: string} = require(SQUIDLET_PACKAGE_JSON_PATH);

  return _template(templateContent)({
    version: squildletPackageJson.version,
    dependencies: JSON.stringify(dependencies),
  });
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
