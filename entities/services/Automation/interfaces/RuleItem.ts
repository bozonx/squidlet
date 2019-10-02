import {RulsTriggers} from '../RulsTriggers';
import {RuleActions} from '../RuleActions';


export default interface RuleItem {
  name: string;
  triggers: RulsTriggers;
  actions: RuleActions;
}
