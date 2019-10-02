import {TriggerDefinition} from './RuleDefinition';
import {RuleTriggers} from '../rule/RuleTriggers';


export type TriggerItemClass = new (manager: RuleTriggers, definition: TriggerDefinition) => TriggerItem;

export default interface TriggerItem {
  onSwitch(cb: () => void): number;
  destroy(): void;
}
