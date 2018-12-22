import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import ConfigSetBase from '../host/src/app/config/ConfigSetBase';


export default class ConfigSetSolid extends ConfigSetBase {
  // host config which is integrated at index files init time
  static hostConfigSet: HostFilesSet;

  get configSet(): HostFilesSet {
    return ConfigSetSolid.hostConfigSet;
  }

}
