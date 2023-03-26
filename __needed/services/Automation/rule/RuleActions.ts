import Context from 'src/system/Context';
import RuleDefinition, {ActionDefinition} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleDefinition.js';
import ActionItem, {ActionItemClass} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ActionItem.js';
import RuleItem from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleItem.js';
import DeviceAction from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/actions/DeviceAction.js';


const actionsClasses: {[index: string]: ActionItemClass} = {
  action: DeviceAction,
};


export class RuleActions {
  readonly context: Context;
  readonly rules: RuleItem[];
  readonly ruleName: string;
  readonly ruleDefinition: RuleDefinition;
  private readonly actions: ActionItem[];


  constructor(
    context: Context,
    rules: RuleItem[],
    ruleName: string,
    ruleDefinition: RuleDefinition
  ) {
    this.context = context;
    this.rules = rules;
    this.ruleName = ruleName;
    this.ruleDefinition = ruleDefinition;
    this.actions = this.makeActions(ruleDefinition.action);
  }

  destroy() {
    for (let action of this.actions) {
      action.destroy();
    }
  }


  /**
   * Execute all the actions synchronously
   */
  execute() {
    for (let action of this.actions) {
      action.execute()
        .catch(this.context.log.error);
    }
  }


  private makeActions(action: ActionDefinition[]): ActionItem[] {
    const result: ActionItem[] = [];

    for (let actionDefinition of action) {
      result.push(this.instantiateActionItem(actionDefinition));
    }

    return result;
  }

  private instantiateActionItem(actionDefinition: ActionDefinition): ActionItem {
    if (!actionsClasses[actionDefinition.type]) {
      throw new Error(`Unsupported trigger type: ${actionDefinition.type}`);
    }

    return new actionsClasses[actionDefinition.type](this, actionDefinition);
  }

}
