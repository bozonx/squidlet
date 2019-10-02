import {RuleTriggers} from '../RuleTriggers';
import {RuleActions} from '../RuleActions';
import RuleCheck from '../RuleCheck';


export default interface RuleItem {
  name: string;
  triggers: RuleTriggers;
  check: RuleCheck;
  actions: RuleActions;
}
