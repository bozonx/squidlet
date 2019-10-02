import Context from 'system/Context';
import RuleDefinition, {TriggerDefinition} from '../interfaces/RuleDefinition';
import TriggerItem, {TriggerItemClass} from '../interfaces/TriggerItem';
import {RuleActions} from './RuleActions';
import RuleItem from '../interfaces/RuleItem';
import DeviceStatus from '../triggers/DeviceStatus';


const triggerClasses: {[index: string]: TriggerItemClass} = {
  status: DeviceStatus,
};


export class RuleTriggers {
  readonly context: Context;
  readonly rules: RuleItem[];
  readonly ruleName: string;
  readonly ruleDefinition: RuleDefinition;
  readonly actionsManager: RuleActions;
  readonly triggers: TriggerItem[];


  constructor(
    context: Context,
    rules: RuleItem[],
    ruleName: string,
    ruleDefinition: RuleDefinition,
    actionsManager: RuleActions
  ) {
    this.context = context;
    this.rules = rules;
    this.ruleName = ruleName;
    this.ruleDefinition = ruleDefinition;
    this.actionsManager = actionsManager;
    this.triggers = this.makeTriggers(ruleDefinition.trigger);
  }


  /**
   * Are triggers started and listen.
   */
  isTriggersActive(): boolean {
    // TODO: add
  }

  /**
   * Stop listen
   */
  startTriggers() {
    // TODO: add
  }

  /**
   * Start listen
   */
  stopTriggers() {
    // TODO: add
  }

  destroy() {
    // TODO: add
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