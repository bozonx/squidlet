import * as path from 'path';

import AppBuilder from './builders/AppBuilder';
import Platforms from '../system/interfaces/Platforms';
import {REPO_ROOT} from '../shared/helpers';
import {IoServerStandaloneBuilder} from './builders/IoServerStandaloneBuilder';
import LogLevel from '../system/interfaces/LogLevel';
import {makeBundleCheckSum} from './helpers';
import {BUNDLE_FILE_NAME, BUNDLE_SUM_FILE_NAME} from '../entities/services/Updater/Updater';


const SQUIDLET_LIGHT_WORK_DIR = 'light';
const TMP_SUB_DIR = 'tmp';


function resolveWorkDir(argTmpDir?: string): string {
  if (argTmpDir) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), argTmpDir);
  }

  return path.join(REPO_ROOT, 'build', SQUIDLET_LIGHT_WORK_DIR);
}

function resolveOutputDir(tmpDir: string, output?: string): string {
  if (output) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), output);
  }

  return tmpDir;
}


export default async function squidletLightBuilder (
  argWorkDir?: string,
  argOutputDir?: string,
  platform?: Platforms,
  machine?: string,
  minimize?: boolean,
  ioServer?: boolean,
  logLevel?: LogLevel,
  hostConfigPath?: string
): Promise<void> {
  const workDir: string = resolveWorkDir(argWorkDir);
  const tmpDir: string = path.join(workDir, TMP_SUB_DIR);
  const outputDir: string = resolveOutputDir(workDir, argOutputDir);
  const bundlePath: string = path.join(outputDir, BUNDLE_FILE_NAME);
  const checkSumPath: string = path.join(outputDir, BUNDLE_SUM_FILE_NAME);

  if (!platform) {
    console.error(`--platform is required`);
    return process.exit(2);
  }
  else if (!machine) {
    console.error(`--machine is required`);
    return process.exit(2);
  }
  else if (!hostConfigPath) {
    console.error(`host config is required`);
    return process.exit(2);
  }

  if (ioServer) {
    // build io server standalone
    const builder = new IoServerStandaloneBuilder(
      tmpDir,
      bundlePath,
      platform,
      machine,
      hostConfigPath,
      minimize,
      logLevel
    );

    return await builder.build();
  }

  // build app with app switcher
  const builder = new AppBuilder(
    tmpDir,
    bundlePath,
    platform,
    machine,
    hostConfigPath,
    minimize,
    logLevel
  );

  await builder.build();
  await makeBundleCheckSum(bundlePath, checkSumPath);
}
