import {ActionDefinition} from './RuleDefinition';
import {RuleActions} from '../rule/RuleActions';


export type ActionItemClass = new (manager: RuleActions, definition: ActionDefinition) => ActionItem;

export default interface ActionItem {
  execute(): Promise<void>;
  destroy(): void;
}
