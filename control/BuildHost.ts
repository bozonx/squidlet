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

    this.hostId = preHostConfig.id;
    this.preHostConfig = preHostConfig;
    this.buildDir = path.join(buildDir, this.hostId);
    this.tmpDir = path.join(tmpDir, this.hostId);
    this.io = io;
  }

  async build() {
    await this.io.mkdirP(this.buildDir);
    await this.io.rimraf(`${this.buildDir}/**/*`);
    await this.io.mkdirP(this.tmpDir);
    await this.io.rimraf(`${this.tmpDir}/**/*`);

    console.info(`===> generating configs and entities of host "${this.hostId}"`);

    const envBuilder: EnvBuilder = new EnvBuilder(this.preHostConfig, this.buildDir, this.tmpDir);

    await envBuilder.collect();
    await envBuilder.writeConfigs();
    await envBuilder.writeEntities();
  }

}
