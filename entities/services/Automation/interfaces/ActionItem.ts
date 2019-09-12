import {ActionDefinition} from './RuleDefinition';
import {ActionsManager} from '../ActionsManager';


export type ActionItemClass = new (manager: ActionsManager, definition: ActionDefinition) => ActionItem;

export default interface ActionItem {

}
