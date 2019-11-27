import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import {getFileNameOfPath, removeExtFromFileName, REPO_ROOT} from '../shared/helpers';
import rollupToOneFile from '../shared/buildToJs/rollupToOneFile';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import {callPromised} from '../system/lib/common';
import {ENCODE} from '../system/lib/constants';


const SQUIDLET_LIGHT_WORK_DIR = 'light';


export function prepareIoClassesString(
  machineIosList: string[],
  platformDir: string,
  tmpDir: string
): string {
  let exportsStr = '';

  for (let ioPath of machineIosList) {
    const ioName: string = getFileNameOfPath(ioPath);
    const ioRelPath: string = path.relative(
      tmpDir,
      path.resolve(platformDir, ioPath)
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

export async function makeBundleCheckSum(bundlePath: string, sumFilePath: string) {
  const bundleContent: string = await callPromised(fs.readFile, bundlePath);
  const sum: string = crypto
    .createHash('md5')
    .update(bundleContent, ENCODE)
    .digest('hex');

  await callPromised(fs.writeFile, sumFilePath, sum, ENCODE);
}

export function resolveWorkDir(): string {
  // if (argTmpDir) {
  //   // if it set as an argument - make it absolute
  //   return path.resolve(process.cwd(), argTmpDir);
  // }

  return path.join(REPO_ROOT, 'build', SQUIDLET_LIGHT_WORK_DIR);
}

export function resolveOutputDir(tmpDir: string, output?: string): string {
  if (output) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), output);
  }

  return tmpDir;
}
