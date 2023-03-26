import {RuleTriggers} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleTriggers.js';
import {RuleActions} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleActions.js';
import RuleCheckCondition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleCheckCondition.js';


export default interface RuleItem {
  name: string;
  triggers: RuleTriggers;
  actions: RuleActions;
  checkCondition?: RuleCheckCondition;
}
