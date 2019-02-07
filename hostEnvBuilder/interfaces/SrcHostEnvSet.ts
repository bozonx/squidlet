import DefinitionsSet from './DefinitionsSet';
import {SrcEntitiesSet} from './EntitySet';
import HostConfig from '../../host/interfaces/HostConfig';


// export type SetConfigName = 'config'
//   | 'entitiesSet'
//   | 'systemDrivers'
//   | 'regularDrivers'
//   | 'systemServices'
//   | 'regularServices'
//   | 'devicesDefinitions'
//   | 'driversDefinitions'
//   | 'servicesDefinitions';


interface Configs extends DefinitionsSet {
  config: HostConfig;
}


export default interface SrcHostEnvSet {
  configs: Configs;
  entities: SrcEntitiesSet;
}
