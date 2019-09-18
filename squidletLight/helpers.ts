import * as path from 'path';

import {getFileNameOfPath, removeExtFromFileName} from '../shared/helpers';
import rollupToOneFile from '../shared/buildToJs/rollupToOneFile';


export function prepareIoClassesString(): string {
  const platformDir = this.envBuilder.configManager.machinePlatformDir;
  // TODO: лучше брать только те что реально используются
  const machineIosList = this.envBuilder.configManager.machineConfig.ios;
  let exportsStr = '';

  for (let ioPath of machineIosList) {
    const ioName: string = getFileNameOfPath(ioPath);
    const ioRelPath: string = path.relative(
      this.tmpDir,
      path.resolve(platformDir, ioPath)
    );

    exportsStr += makeExportString(ioName, ioRelPath);
  }

  return exportsStr;
}

export function makeExportString(defaultImportName: string, pathToFile: string): string {
  return `export {default as ${defaultImportName}} from '${removeExtFromFileName(pathToFile)}';\n`;
}

export async function rollupBuild(workDir: string, tmpDir: string, minimize: boolean = false) {
  const indexFilePath = path.join(tmpDir, 'index.ts');
  const outputFilePath = path.join(workDir, 'index.js');

  await rollupToOneFile(
    'Squidlet',
    indexFilePath,
    outputFilePath,
    undefined,
    // TODO: better to build in
    [
      'ws',
      'mqtt-packet',
      'mqtt',
      'axios',
      // TODO: build in this
      'bcx-expression-evaluator',
    ],
    false,
    minimize,
  );
}
