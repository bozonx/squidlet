import DefinitionsSet from '../../../../configWorks/interfaces/DefinitionsSet';
import {SrcEntitiesSet, EntitiesSet} from '../../../../configWorks/interfaces/EntitySet';


export interface SrcHostFilesSet extends DefinitionsSet {
  entitiesSet: SrcEntitiesSet;
}

export interface HostFilesSet extends DefinitionsSet {
  entitiesSet: EntitiesSet;
}
