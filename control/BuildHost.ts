import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import Io from '../hostEnvBuilder/Io';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';


export default class BuildHost {
  private readonly preHostConfig: PreHostConfig;
  private readonly buildDir: string;
  private readonly tmpDir: string;
  private readonly hostId: string;
  private readonly io: Io;


  constructor(preHostConfig: PreHostConfig, buildDir: string, tmpDir: string, io: Io) {
    if (!preHostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }

    this.preHostConfig = preHostConfig;
    this.buildDir = buildDir;
    this.tmpDir = tmpDir;
    this.hostId = preHostConfig.id;
    this.io = io;
  }

  async build() {
    const hostBuildDir: string = path.join(this.buildDir, this.hostId);

    await this.io.mkdirP(hostBuildDir);
    await this.io.rimraf(`${hostBuildDir}/**/*`);

    console.info(`===> generating configs and entities of host "${this.hostId}"`);

    // TODO: use tmpDir

    const envBuilder: EnvBuilder = new EnvBuilder(this.preHostConfig, hostBuildDir);

    await envBuilder.collect();
    await envBuilder.writeConfigs();
    await envBuilder.writeEntities();
  }

}
