import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';


export default class GroupConfig {
  private readonly groupConfigPath: string;
  private readonly preHostsConfigs: {[index: string]: PreHostConfig} = {};
  get hosts(): {[index: string]: PreHostConfig} {
    return this.preHostsConfigs;
  }


  constructor(groupConfigPath: string) {
    this.groupConfigPath = groupConfigPath;
  }

  async init() {
    // TODO: read configs and process it

    this.preHostsConfigs['host'] = {id: 'host'};
  }

}
