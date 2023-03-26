import {TriggerDefinition} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleDefinition.js';
import {RuleTriggers} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleTriggers.js';


export type TriggerItemClass = new (manager: RuleTriggers, definition: TriggerDefinition) => TriggerItem;

export default interface TriggerItem {
  onTrigger(cb: () => void): number;
  destroy(): void;
}
