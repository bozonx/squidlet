import * as path from 'path';
import * as yargs from 'yargs';

import AppBuilder from './builders/AppBuilder';
import Platforms from '../system/interfaces/Platforms';
import {REPO_ROOT} from '../shared/helpers';
import {IoServerStandaloneBuilder} from './builders/IoServerStandaloneBuilder';
import LogLevel from '../system/interfaces/LogLevel';


const SQUIDLET_LIGHT_TMP_DIR = 'light';

export function resolveTmpDir(argTmpDir?: string): string {
  if (argTmpDir) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), argTmpDir);
  }

  return path.join(REPO_ROOT, 'build', SQUIDLET_LIGHT_TMP_DIR);
}

export function resolveOutputPath(tmpDir: string, output?: string): string {
  if (output) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), output);
  }

  return path.join(tmpDir, 'index.js');
}


export default async function(): Promise<void> {
  const tmpDir: string = resolveTmpDir(yargs.argv.tmpDir as any);
  const outputPath: string = resolveOutputPath(tmpDir, yargs.argv.output as any);
  const platform: Platforms | undefined = yargs.argv.platform as any;
  const machine: string | undefined = yargs.argv.machine as any;
  const hostConfigPath: string | undefined = yargs.argv._[0] as any;
  const minimize: boolean = yargs.argv.minimize !== 'false';
  const onlyUsedIo: boolean = yargs.argv.onlyUsedIo === 'true';
  const logLevel: LogLevel | undefined = yargs.argv.logLevel as any || undefined;

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

  if (yargs.argv.ioServer) {
    // build io server standalone
    const builder = new IoServerStandaloneBuilder(
      tmpDir,
      outputPath,
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
    outputPath,
    platform,
    machine,
    hostConfigPath,
    minimize,
    onlyUsedIo,
    logLevel
  );

  await builder.build();
}
