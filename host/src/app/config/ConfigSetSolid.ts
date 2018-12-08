import {HostFilesSet} from '../interfaces/HostFilesSet';
import ConfigSetBase from './ConfigSetBase';


export default class ConfigSetSolid extends ConfigSetBase {
  // host config which is integrated at index files init time
  static hostConfigSet: HostFilesSet;

  get configSet(): HostFilesSet {
    return ConfigSetSolid.hostConfigSet;
  }

}
