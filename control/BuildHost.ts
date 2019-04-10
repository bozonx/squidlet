import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import Io from '../hostEnvBuilder/Io';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';


export default class BuildHost {
  private readonly preHostConfig: PreHostConfig;
  private readonly hostBuildDir: string;
  private readonly hostTmpDir: string;
  private readonly hostId: string;
  private readonly io: Io;


  constructor(io: Io, preHostConfig: PreHostConfig, buildDir: string, tmpDir: string) {
    if (!preHostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }

    this.hostId = preHostConfig.id;
    this.preHostConfig = preHostConfig;
    this.hostBuildDir = path.join(buildDir, this.hostId);
    this.hostTmpDir = path.join(tmpDir, this.hostId);
    this.io = io;
  }

  async build() {
    await this.io.mkdirP(this.hostBuildDir);
    //await this.io.rimraf(`${this.hostBuildDir}/**/*`);
    await this.io.mkdirP(this.hostTmpDir);

    const envBuilder: EnvBuilder = new EnvBuilder(this.preHostConfig, this.hostBuildDir, this.hostTmpDir);

    await envBuilder.collect();
    await envBuilder.writeConfigs();
    await envBuilder.writeEntities();
  }

}
