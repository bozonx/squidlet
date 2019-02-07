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


export default interface SrcHostEnvSet extends DefinitionsSet {
  entitiesSet: SrcEntitiesSet;
  config: HostConfig;
}
