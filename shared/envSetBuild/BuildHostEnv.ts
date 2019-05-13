import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import Os from '../Os';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';


export default class BuildHostEnv {
  private readonly preHostConfig: PreHostConfig;
  private readonly hostBuildDir: string;
  private readonly hostTmpDir: string;
  private readonly os: Os;


  constructor(os: Os, preHostConfig: PreHostConfig, hostsBuildDir: string, hostsTmpDir: string) {
    this.preHostConfig = preHostConfig;
    this.hostBuildDir = hostsBuildDir;
    this.hostTmpDir = hostsTmpDir;
    this.os = os;
  }

  async build() {
    await this.os.mkdirP(this.hostBuildDir);
    //await this.os.rimraf(`${this.hostBuildDir}/**/*`);
    await this.os.mkdirP(this.hostTmpDir);

    const envBuilder: EnvBuilder = new EnvBuilder(this.preHostConfig, this.hostBuildDir, this.hostTmpDir);

    await envBuilder.collect();
    await envBuilder.writeConfigs();
    await envBuilder.writeEntities();
  }

}
