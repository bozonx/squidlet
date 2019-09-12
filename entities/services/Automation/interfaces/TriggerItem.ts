import {TriggerDefinition} from './RuleDefinition';
import {TriggersManager} from '../TriggersManager';


export type TriggerItemClass = new (manager: TriggersManager, definition: TriggerDefinition) => TriggerItem;

export default interface TriggerItem {

}
