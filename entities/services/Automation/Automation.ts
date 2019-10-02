import ServiceBase from 'system/base/ServiceBase';

import RuleItem from './interfaces/RuleItem';
import RuleDefinition from './interfaces/RuleDefinition';
import {RulsTriggers} from './RulsTriggers';
import {RuleActions} from './RuleActions';


interface Props {
  rules: RuleDefinition[];
}

let nameIndex: number = 0;


export default class Automation extends ServiceBase<Props> {
  private readonly rules: RuleItem[] = [];


  protected appDidInit = async () => {
    this.log.debug(`Automation: starting preparing rules`);
    this.prepareRules();
  }


  /**
   * Turn on or off an automation rule.
   */
  turnRule(ruleName: string, turnTo: boolean) {
    // TODO: add
  }


  private prepareRules() {
    for (let ruleDefinition of this.props.rules) {
      this.validateRule(ruleDefinition);

      const name: string = ruleDefinition.name || this.generateUniqName();
      const actions = new RuleActions(this.context, this.expressionManager, this.rules,  name, ruleDefinition);
      const check = new RuleCheck();
      const triggers = new RulsTriggers(this.context, this.expressionManager, this.rules, name, ruleDefinition, actions);

      const ruleItem: RuleItem = {
        name,
        triggers,
        check,
        actions,
      };

      this.rules.push(ruleItem);
    }
  }

  private validateRule(ruleDefinition: RuleDefinition) {
    // TODO: validate rule definition
  }

  private generateUniqName(): string {
    nameIndex++;

    return String(nameIndex);
  }

}
