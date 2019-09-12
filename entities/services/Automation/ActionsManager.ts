import Context from 'system/Context';
import RuleDefinition, {ActionDefinition} from './interfaces/RuleDefinition';
import ActionItem, {ActionItemClass} from './interfaces/ActionItem';
import TriggerItem from './interfaces/TriggerItem';
import RuleItem from './interfaces/RuleItem';
import DeviceAction from './actions/DeviceAction';


const actionsClasses: {[index: string]: ActionItemClass} = {
  deviceAction: DeviceAction,
};


export class ActionsManager {
  readonly context: Context;
  readonly rules: RuleItem[];
  readonly ruleName: string;
  readonly ruleDefinition: RuleDefinition;
  readonly actions: ActionItem[];


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


  /**
   * Execute all the actions
   */
  execute() {
    for (let action of this.actions) {
      action.execute();
    }
  }


  private makeActions(action: ActionDefinition[]): ActionItem[] {
    const result: TriggerItem[] = [];

    for (let actionDefinition of action) {
      result.push(this.instantiateActionItem(actionDefinition));
    }

    return result;
  }

  private instantiateActionItem(actionDefinition: ActionDefinition): ActionItem {
    const action: ActionItem = new actionsClasses[actionDefinition.type](this, actionDefinition);

    return action;
  }

}
