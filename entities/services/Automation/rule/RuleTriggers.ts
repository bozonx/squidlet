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
  private readonly triggeredCb: () => void;
  private triggers?: TriggerItem[];


  constructor(
    context: Context,
    rules: RuleItem[],
    ruleName: string,
    ruleDefinition: RuleDefinition,
    triggeredCb: () => void
  ) {
    this.context = context;
    this.rules = rules;
    this.ruleName = ruleName;
    this.ruleDefinition = ruleDefinition;
    this.triggeredCb = triggeredCb;
    // make triggers instances
    this.startTriggers();
  }

  destroy() {
    // TODO: add
    this.stopTriggers();
  }


  /**
   * Are triggers started and listen.
   */
  isTriggersActive(): boolean {
    return Boolean(this.triggers);
  }

  /**
   * Start listen
   */
  startTriggers() {
    // don't start twice
    if (this.triggers) return;

    this.triggers = [];

    for (let triggerDefinition of this.ruleDefinition.trigger) {
      this.triggers.push(this.instantiateTriggerItem(triggerDefinition));
    }
  }

  /**
   * Stop listen
   */
  stopTriggers() {
    if (!this.triggers) return;

    for (let trigger of this.triggers) {
      trigger.destroy();
    }

    delete this.triggers;
  }


  private instantiateTriggerItem(triggerDefinition: TriggerDefinition): TriggerItem {
    if (!triggerClasses[triggerDefinition.type]) {
      throw new Error(`Unsupported trigger type: ${triggerDefinition.type}`);
    }

    const trigger: TriggerItem = new triggerClasses[triggerDefinition.type](this, triggerDefinition);

    trigger.onTrigger(this.handleTriggerSwitch);

    return trigger;
  }

  private handleTriggerSwitch = () => {
    this.context.log.debug(`Automation: triggered rule "${this.ruleName}"`);
    this.triggeredCb();
  }

}
