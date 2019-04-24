import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import Os from '../shared/Os';


export default class UpdateHost {
  private readonly preHostConfig: PreHostConfig;
  private readonly buildDir: string;
  private readonly tmpDir: string;
  private readonly hostId: string;
  private readonly os: Os;


  constructor(os: Os, preHostConfig: PreHostConfig, buildDir: string, tmpDir: string) {
    if (!preHostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }

    this.preHostConfig = preHostConfig;
    this.buildDir = buildDir;
    this.tmpDir = tmpDir;
    this.hostId = preHostConfig.id;
    this.os = os;
  }

  async update() {
    // TODO: call HostClient methods to update

    console.log(1111111111, this.preHostConfig);
  }

}
