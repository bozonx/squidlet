import Context from '__old/system/Context';
import RuleItem from '../interfaces/RuleItem';
import RuleDefinition from '../interfaces/RuleDefinition';
import AndValue from '../values/AndValue';


export default class RuleCheckCondition {
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


  isAllowedExecute() {
    // allow execute if there isn't "if" section
    if (!this.ruleDefinition.if) return true;

    // TODO: может вернуть промис

    return AndValue(this.context, {
      type: 'and',
      check: this.ruleDefinition.if,
    });
  }


  destroy() {
    // TODO: add
  }

}
