import {TriggerDefinition} from './RuleDefinition';
import {RulsTriggers} from '../RulsTriggers';


export type TriggerItemClass = new (manager: RulsTriggers, definition: TriggerDefinition) => TriggerItem;

export default interface TriggerItem {
  onSwitch(cb: () => void): number;
}
