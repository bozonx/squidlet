import {RuleTriggers} from '../rule/RuleTriggers';
import {RuleActions} from '../rule/RuleActions';
import RuleCheckCondition from '../rule/RuleCheckCondition';


export default interface RuleItem {
  name: string;
  triggers: RuleTriggers;
  actions: RuleActions;
  checkCondition?: RuleCheckCondition;
}
