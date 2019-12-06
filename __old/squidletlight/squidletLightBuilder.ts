import * as path from 'path';

import AppBuilder from '../../squidletLight/AppBuilder';
import Platforms from '../../system/interfaces/Platforms';
import LogLevel from '../../system/interfaces/LogLevel';
import {makeBundleCheckSum, resolveOutputDir} from '../../squidletLight/helpers';
import {BUNDLE_FILE_NAME, BUNDLE_SUM_FILE_NAME} from '../../entities/services/Updater/Updater';
import {REPO_ROOT} from '../../shared/helpers/helpers';


export const SQUIDLET_LIGHT_WORK_DIR = 'light';
const TMP_SUB_DIR = 'tmp';
const IO_SERVER_DEFAULT_HOST_CONFIG_PATH = path.join(__dirname, 'ioServerHostConfig.yaml');


export default async function squidletLightBuilder (
  platform?: Platforms,
  machine?: string,
  argOutputDir?: string,
  minimize?: boolean,
  ioServer?: boolean,
  logLevel?: LogLevel,
  hostConfigPath?: string
): Promise<void> {
  const workDir: string = path.join(REPO_ROOT, 'build', SQUIDLET_LIGHT_WORK_DIR);
  const tmpDir: string = path.join(workDir, TMP_SUB_DIR);
  const outputDir: string = resolveOutputDir(workDir, argOutputDir);

  if (!platform) {
    console.error(`--platform is required`);
    return process.exit(2);
  }
  else if (!machine) {
    console.error(`--machine is required`);
    return process.exit(2);
  }
  else if (!ioServer && !hostConfigPath) {
    console.error(`host config is required`);
    return process.exit(2);
  }

  // build app with app switcher
  const builder = new AppBuilder(
    tmpDir,
    outputDir,
    platform,
    machine,
    hostConfigPath || IO_SERVER_DEFAULT_HOST_CONFIG_PATH,
    minimize,
    logLevel,
    ioServer
  );

  await builder.build();
}
