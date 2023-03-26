import * as path from 'path';

import {getFileNameOfPath, removeExtFromFileName} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/helpers.js';
import rollupToOneFile from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/buildToJs/rollupToOneFile.js';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';


export function prepareIoClassesString(
  machineIos: {[index: string]: string},
  platformDir: string,
  tmpDir: string
): string {
  let exportsStr = '';

  for (let ioName of Object.keys(machineIos)) {
    const ioRelPath: string = path.relative(
      tmpDir,
      path.resolve(platformDir, machineIos[ioName])
    );

    exportsStr += makeExportString(ioName, ioRelPath);
  }

  return exportsStr;
}

export function prepareEnvSetString(envSet: HostEnvSet): string {
  const envSetStr = JSON.stringify(envSet, null,2);

  return `const envSet: any = ${envSetStr};\n\n`
    + `export default envSet;`;
}

export function makeExportString(defaultImportName: string, pathToFile: string): string {
  return `export {default as ${defaultImportName}} from '${removeExtFromFileName(pathToFile)}';\n`;
}

export async function rollupBuild(outputPath: string, tmpDir: string, minimize: boolean = false) {
  const indexFilePath = path.join(tmpDir, 'index.ts');

  await rollupToOneFile(
    'Squidlet',
    indexFilePath,
    outputPath,
    undefined,
    // TODO: в режиме билда для nodejs исключаем. Но для мк лучше вбилдить?
    [
      'ws',
      'mqtt-packet',
      'mqtt',
      'axios',
      // TODO: build in this
      //'bcx-expression-evaluator',
    ],
    false,
    minimize,
  );
}

export function resolveOutputDir(tmpDir: string, output?: string): string {
  if (output) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), output);
  }

  return tmpDir;
}

// export function resolveWorkDir(): string {
//   // if (argTmpDir) {
//   //   // if it set as an argument - make it absolute
//   //   return path.resolve(process.cwd(), argTmpDir);
//   // }
//
//   return path.join(REPO_ROOT, 'build', SQUIDLET_LIGHT_WORK_DIR);
// }
