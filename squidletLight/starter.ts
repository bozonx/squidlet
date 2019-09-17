import * as path from 'path';
import * as yargs from 'yargs';

import LightBuilder from './LightBuilder';
import Platforms from '../system/interfaces/Platforms';
import {REPO_ROOT} from '../shared/helpers';


const SQUIDLET_LIGTH_WORKDIR = 'light';


export function resolveWorkDir(argWorkDir?: string): string {
  if (argWorkDir) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), argWorkDir);
  }

  return path.join(REPO_ROOT, 'build', SQUIDLET_LIGTH_WORKDIR);
}


export default async function(): Promise<void> {
  const workDir: string = resolveWorkDir(yargs.argv.workDir as any);
  const platform: Platforms | undefined = yargs.argv.platform as any;
  const machine: string | undefined = yargs.argv.machine as any;
  const hostConfigPath: string | undefined = yargs.argv._[0] as any;

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

  const builder = new LightBuilder(
    workDir,
    platform,
    machine,
    hostConfigPath
  );

  await builder.build();
}
