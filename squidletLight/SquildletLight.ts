import * as yargs from 'yargs';
import LightBuilder from './LightBuilder';
import Platforms from '../system/interfaces/Platforms';


export default class SquildletLight {
  async start(): Promise<void> {
    const workDir: string | undefined = yargs.argv.workDir as any;
    const platform: Platforms | undefined = yargs.argv.platform as any;
    const machine: string | undefined = yargs.argv.machine as any;
    const hostConfigPath: string | undefined = yargs.argv._[0] as any;

    if (!workDir) {
      console.error(`--work-dir is required`);
      return process.exit(2);
    }
    else if (!platform) {
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

}
