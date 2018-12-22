import DefinitionsSet from './DefinitionsSet';
import {SrcEntitiesSet, EntitiesSet} from './EntitySet';
import HostConfig from './HostConfig';


// TODO: rename to HostConfigSet


export type SetConfigName = 'config'
  | 'entitiesSet'
  | 'systemDrivers'
  | 'regularDrivers'
  | 'systemServices'
  | 'regularServices'
  | 'devicesDefinitions'
  | 'driversDefinitions'
  | 'servicesDefinitions';


export interface SrcHostFilesSet extends DefinitionsSet {
  entitiesSet: SrcEntitiesSet;
  config: HostConfig;
}

export interface HostFilesSet extends DefinitionsSet {
  entitiesSet: EntitiesSet;
  config: HostConfig;
}
