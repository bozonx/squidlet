import {HostFilesSet} from '../interfaces/HostFilesSet';
import ConfigSetBase from './ConfigSetBase';


export default class ConfigSetSolid extends ConfigSetBase {
  get configSet(): HostFilesSet {
    // TODO: может лучше использовать requireJs?
    return (global as any).__HOST_CONFIG_SET as HostFilesSet;
  }

}
