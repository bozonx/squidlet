import ServiceBase from 'src/base/ServiceBase';

import RuleItem from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleItem.js';
import RuleDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleDefinition.js';
import {RuleTriggers} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleTriggers.js';
import {RuleActions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleActions.js';
import RuleCheckCondition from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleCheckCondition.js';


interface Props {
  rules: RuleDefinition[];
}

let nameIndex: number = 0;


export default class Automation extends ServiceBase<Props> {
  private rules: RuleItem[] = [];


  // TODO: нужно чтобы выполнилось вообще в самом конце
  protected async appDidInit() {
    this.log.debug(`Automation: starting preparing rules`);
    await this.prepareRules();
  }

  destroy = async () => {
    for (let rule of this.rules) {
      rule.triggers.destroy();
      rule.actions.destroy();

      if (rule.checkCondition) rule.checkCondition.destroy();
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
      let checkCondition: RuleCheckCondition | undefined;

      if (ruleDefinition.if) {
        checkCondition = new RuleCheckCondition(this.context, this.rules, name, ruleDefinition)
      }

      const triggeredCb = () => {
        if (checkCondition && !checkCondition.isAllowedExecute()) return;

        actions.execute();
      };
      const triggers = new RuleTriggers(
        this.context,
        this.rules,
        name,
        ruleDefinition,
        triggeredCb
      );

      const ruleItem: RuleItem = {
        name,
        triggers,
        actions,
        checkCondition,
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
