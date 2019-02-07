import DefinitionsSet from './DefinitionsSet';
import SrcEntitiesSet from './SrcEntitiesSet';
import HostConfig from '../../host/interfaces/HostConfig';


interface Configs extends DefinitionsSet {
  config: HostConfig;
}


export default interface SrcHostEnvSet {
  configs: Configs;
  entities: SrcEntitiesSet;
}
