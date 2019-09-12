import TriggerItem from './TriggerItem';
import ActionItem from './ActionItem';


export default interface RuleItem {
  name: string;
  triggers: TriggerItem[];
  actions: ActionItem[];
}
