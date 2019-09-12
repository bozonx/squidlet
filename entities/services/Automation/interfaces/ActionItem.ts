import {ActionDefinition} from './RuleDefinition';


export type ActionItemClass = new (definition: ActionDefinition) => ActionItem;

export default interface ActionItem {

}
