import DefinitionsSet from '../../../../configWorks/interfaces/DefinitionsSet';
import {SrcEntitiesSet, EntitiesSet} from '../../../../configWorks/interfaces/EntitySet';
import HostConfig from './HostConfig';


export interface SrcHostFilesSet extends DefinitionsSet {
  entitiesSet: SrcEntitiesSet;
  config: HostConfig;
}

export interface HostFilesSet extends DefinitionsSet {
  entitiesSet: EntitiesSet;
  config: HostConfig;
}
