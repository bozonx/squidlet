import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';

export default class UpdateHost {
  private readonly preHostConfig: PreHostConfig;

  constructor(preHostConfig: PreHostConfig) {
    this.preHostConfig = preHostConfig;
  }

  async update() {
    // TODO: make EnvSet instance
  }

}
