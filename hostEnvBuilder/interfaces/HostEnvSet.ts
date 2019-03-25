import {HostEntitySet} from './HostEntitySet';
import HostConfigSet from './HostConfigSet';


export default interface HostEnvSet {
  configs: HostConfigSet;
  entities: HostEntitySet;
}
