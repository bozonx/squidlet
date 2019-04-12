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


    this.validate();

    // TODO: брать workDir из host config

    this.workDir = this.args.workDir;
    this.machine = this.args.machine;
    this.hostId = this.hostConfig.id as any;
  }

  validate() {
    if (!this._hostConfig) {
      throw new Error(`You have to define host config`);
    }
    else if (!this._hostConfig.id) {
      throw new Error(`You have to specify an host id in your host config`);
    }
    else if (this.args.hostName && this.args.hostName !== this.hostConfig.id) {
      throw new Error(`Param "id" of host config "${this.hostId}" is not as specified as a command argument "${this.args.hostName}"`);
    }
    else if (this.platform !== this.hostConfig.platform) {
      throw new Error(`Param "platform" of host config "${this.hostId}" is not a "${this.platform}"`);
    }
    else if (this.args.machine !== this.hostConfig.machine) {
      throw new Error(`Param "machine" of host config "${this.hostId}" is not a "${this.args.machine}"`);
    }
  }

}
