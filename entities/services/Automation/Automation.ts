import ServiceBase from 'system/base/ServiceBase';

import RuleItem from './interfaces/RuleItem';
import RuleDefinition from './interfaces/RuleDefinition';
import {RuleTriggers} from './rule/RuleTriggers';
import {RuleActions} from './rule/RuleActions';
import RuleCheck from './rule/RuleCheck';


interface Props {
  rules: RuleDefinition[];
}

let nameIndex: number = 0;


export default class Automation extends ServiceBase<Props> {
  private rules: RuleItem[] = [];


  protected appDidInit = async () => {
    this.log.debug(`Automation: starting preparing rules`);
    await this.prepareRules();
  }

  destroy = async () => {
    for (let rule of this.rules) {
      rule.triggers.destroy();
      rule.check.destroy();
      rule.actions.destroy();
    }

    delete this.rules;
  }


  /**
   * Is rule turned on or off
   */
  getRuleActiveState(ruleName: string): boolean {
    const ruleItem: RuleItem = this.getRuleItem(ruleName);

    return ruleItem.triggers.isTriggersActive();
  }

  /**
   * Turn on or off an automation rule.
   */
  setRuleActive(ruleName: string, setActive: boolean) {
    const ruleItem: RuleItem = this.getRuleItem(ruleName);

    if (setActive) {
      ruleItem.triggers.startTriggers();
    }
    else {
      ruleItem.triggers.stopTriggers();
    }
  }


  private async prepareRules() {
    // TODO: load automation service state file and set turned off that rules that pointed in this file

    for (let ruleDefinition of this.props.rules) {
      this.validateRule(ruleDefinition);

      const name: string = ruleDefinition.name || this.generateUniqName();
      const actions = new RuleActions(this.context, this.rules, name, ruleDefinition);
      const check = new RuleCheck(this.context, this.rules, name, ruleDefinition);
      const triggers = new RuleTriggers(this.context, this.rules, name, ruleDefinition, actions);

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

  private getRuleItem(ruleName: string): RuleItem {
    const ruleItem: RuleItem | undefined = this.rules.find((rule) => rule.name === ruleName);

    if (!ruleItem) throw new Error(`Automation rule "${ruleName}" is not found`);

    return ruleItem;
  }

}
