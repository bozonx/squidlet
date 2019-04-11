import HostConfigSet from './HostConfigSet';
import {HostEntitiesSet} from './HostEntitySet';


export default interface HostEnvSet {
  configs: HostConfigSet;
  entities: HostEntitiesSet;
}
