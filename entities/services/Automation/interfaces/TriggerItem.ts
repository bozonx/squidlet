import {TriggerDefinition} from './RuleDefinition';


export type TriggerItemClass = new (definition: TriggerDefinition) => TriggerItem;

export default interface TriggerItem {

}
