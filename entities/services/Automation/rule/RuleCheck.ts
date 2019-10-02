import Context from 'system/Context';
import RuleItem from '../interfaces/RuleItem';
import RuleDefinition from '../interfaces/RuleDefinition';


export default class RuleCheck {
  readonly context: Context;
  readonly rules: RuleItem[];
  readonly ruleName: string;
  readonly ruleDefinition: RuleDefinition;


  constructor(
    context: Context,
    rules: RuleItem[],
    ruleName: string,
    ruleDefinition: RuleDefinition,
  ) {
    this.context = context;
    this.rules = rules;
    this.ruleName = ruleName;
    this.ruleDefinition = ruleDefinition;
  }


  destroy() {
    // TODO: add
  }

}
