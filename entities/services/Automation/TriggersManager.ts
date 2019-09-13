import Context from 'system/Context';
import RuleDefinition, {TriggerDefinition} from './interfaces/RuleDefinition';
import TriggerItem, {TriggerItemClass} from './interfaces/TriggerItem';
import {ActionsManager} from './ActionsManager';
import RuleItem from './interfaces/RuleItem';
import DeviceState from './triggers/DeviceState';
import ExpressionManager from './ExpressionManager';


const triggerClasses: {[index: string]: TriggerItemClass} = {
  deviceState: DeviceState,
};


export class TriggersManager {
  readonly context: Context;
  readonly expressionManager: ExpressionManager;
  readonly rules: RuleItem[];
  readonly ruleName: string;
  readonly ruleDefinition: RuleDefinition;
  readonly actionsManager: ActionsManager;
  readonly triggers: TriggerItem[];


  constructor(
    context: Context,
    expressionManager: ExpressionManager,
    rules: RuleItem[],
    ruleName: string,
    ruleDefinition: RuleDefinition,
    actionsManager: ActionsManager
  ) {
    this.context = context;
    this.expressionManager = expressionManager;
    this.rules = rules;
    this.ruleName = ruleName;
    this.ruleDefinition = ruleDefinition;
    this.actionsManager = actionsManager;
    this.triggers = this.makeTriggers(ruleDefinition.trigger);
  }

  private makeTriggers(trigger: TriggerDefinition[]): TriggerItem[] {
    const result: TriggerItem[] = [];

    for (let triggerDefinition of trigger) {
      result.push(this.instantiateTriggerItem(triggerDefinition));
    }

    return result;
  }

  private instantiateTriggerItem(triggerDefinition: TriggerDefinition): TriggerItem {
    const trigger: TriggerItem = new triggerClasses[triggerDefinition.type](this, triggerDefinition);

    trigger.onSwitch(this.handleTriggerSwitch);

    return trigger;
  }

  private handleTriggerSwitch = () => {
    this.context.log.debug(`Automation: triggered rule "${this.ruleName}"`);
    this.actionsManager.execute();
  }

}