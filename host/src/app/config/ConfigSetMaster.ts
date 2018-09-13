import {HostFilesSet} from '../interfaces/HostFilesSet';
import ConfigSetBase from './ConfigSetBase';


export default class ConfigSetMaster extends ConfigSetBase {
  // host config which is integrated at index files init time
  static hostConfigSet: HostFilesSet;

  protected get configSet(): HostFilesSet {
    return ConfigSetMaster.hostConfigSet;
  }

}
