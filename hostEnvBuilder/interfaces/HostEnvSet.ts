import {HostEntitiesSet} from './HostEntitiesSet';
import HostConfigSet from './HostConfigSet';


export default interface HostEnvSet {
  configs: HostConfigSet;
  entities: HostEntitiesSet;
}
