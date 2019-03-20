import {SrcEntitiesSet} from './SrcEntitiesSet';
import HostConfigSet from './HostConfigSet';


export default interface SrcHostEnvSet {
  configs: HostConfigSet;
  entities: SrcEntitiesSet;
}
