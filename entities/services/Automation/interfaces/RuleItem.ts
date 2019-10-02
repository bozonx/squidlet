import {RuleTriggers} from '../rule/RuleTriggers';
import {RuleActions} from '../rule/RuleActions';
import RuleCheck from '../rule/RuleCheck';


export default interface RuleItem {
  name: string;
  triggers: RuleTriggers;
  check: RuleCheck;
  actions: RuleActions;
}
