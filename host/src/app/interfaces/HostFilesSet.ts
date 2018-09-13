import DefinitionsSet from '../../../../configWorks/interfaces/DefinitionsSet';
import {EntitiesSet} from '../../../../configWorks/interfaces/EntitySet';


export default interface HostFilesSet extends DefinitionsSet {
  entitiesSet: EntitiesSet;
}
