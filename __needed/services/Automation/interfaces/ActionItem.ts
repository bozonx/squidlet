import {ActionDefinition} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleDefinition.js';
import {RuleActions} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleActions.js';


export type ActionItemClass = new (manager: RuleActions, definition: ActionDefinition) => ActionItem;

export default interface ActionItem {
  execute(): Promise<void>;
  destroy(): void;
}
