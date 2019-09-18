import Context from 'system/Context';
import RuleDefinition, {ActionDefinition} from './interfaces/RuleDefinition';
import ActionItem, {ActionItemClass} from './interfaces/ActionItem';
import RuleItem from './interfaces/RuleItem';
import DeviceAction from './actions/DeviceAction';
import ExpressionManager from './ExpressionManager';


const actionsClasses: {[index: string]: ActionItemClass} = {
  deviceAction: DeviceAction,
};


export class ActionsManager {
  readonly context: Context;
  readonly expressionManager: ExpressionManager;
  readonly rules: RuleItem[];
  readonly ruleName: string;
  readonly ruleDefinition: RuleDefinition;
  readonly actions: ActionItem[];


  constructor(
    context: Context,
    expressionManager: ExpressionManager,
    rules: RuleItem[],
    ruleName: string,
    ruleDefinition: RuleDefinition
  ) {
    this.context = context;
    this.expressionManager = expressionManager;
    this.rules = rules;
    this.ruleName = ruleName;
    this.ruleDefinition = ruleDefinition;
    this.actions = this.makeActions(ruleDefinition.action);
  }


  /**
   * Execute all the actions synchronously
   */
  execute() {
    for (let action of this.actions) {
      action.execute()
        .catch(this.context.log.error);
    }

    // const promises: Promise<void>[] = [];
    //
    // for (let action of this.actions) {
    //   promises.push(action.execute());
    // }
    //
    // Promise.all(promises)
    //   .catch(this.context.log.error);
  }


  private makeActions(action: ActionDefinition[]): ActionItem[] {
    const result: ActionItem[] = [];

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
