import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../control/GroupConfigParser';
import ResolveArgs from './ResolveArgs';


export default class Props {
  workDir: string = '';
  platform: Platforms = 'nodejs';
  machine: string = '';
  hostId: string = '';
  private readonly groupConfig: GroupConfigParser;
  private readonly args: ResolveArgs;
  private _hostConfig?: PreHostConfig;

  get hostConfig(): PreHostConfig {
    return this._hostConfig as any;
  }


  constructor(args: ResolveArgs, groupConfig: GroupConfigParser) {
    this.args = args;
    this.groupConfig = groupConfig;
  }

  resolve() {
    this._hostConfig = this.groupConfig.getHostConfig(this.args.hostName);

    // TODO: workDir
    // TODO: hostId

    if (!this.hostConfig.platform) {
      throw new Error(`Param "platform" is required on host config "${this.hostId}"`);
    }
    else if (!this.hostConfig.machine) {
      throw new Error(`Param "machine" is required on host config "${this.hostId}"`);
    }

  }

}
