import ServiceBase from 'system/base/ServiceBase';
import RuleItem from './interfaces/RuleItem';
import RuleDefinition, {ActionDefinition, TriggerDefinition, TriggerTypes} from './interfaces/RuleDefinition';
import TriggerItem, {TriggerItemClass} from './interfaces/TriggerItem';
import ActionItem, {ActionItemClass} from './interfaces/ActionItem';
import DeviceState from './triggers/DeviceState';
import DeviceAction from './actions/DeviceAction';


interface Props {
  rules: RuleDefinition[];
}

let nameIndex: number = 0;
const triggerClasses: {[index: string]: TriggerItemClass} = {
  deviceState: DeviceState,
};
const actionsClasses: {[index: string]: ActionItemClass} = {
  deviceAction: DeviceAction,
};


export default class Automation extends ServiceBase<Props> {
  private readonly rules: RuleItem[] = [];


  protected appDidInit = async () => {
    this.prepareRules();
  }


  private prepareRules() {
    for (let ruleDefinition of this.props.rules) {
      this.validateRule(ruleDefinition);

      const triggers: TriggerItem[] = this.instantiateTriggers(ruleDefinition.trigger);
      const actions: ActionItem[] = this.instantiateActions(ruleDefinition.action);

      const ruleItem: RuleItem = {
        name: ruleDefinition.name || this.generateQniqName(),
        triggers,
        actions,
      };

      this.rules.push(ruleItem);
    }
  }

  private instantiateTriggers(trigger: TriggerDefinition[]): TriggerItem[] {
    const result: TriggerItem[] = [];

    for (let triggerDefinition of trigger) {
      result.push(new triggerClasses[triggerDefinition.type](triggerDefinition));
    }

    return result;
  }

  private instantiateActions(action: ActionDefinition[]): ActionItem[] {
    const result: TriggerItem[] = [];

    for (let actionDefinition of action) {
      result.push(new actionsClasses[actionDefinition.type](actionDefinition));
    }

    return result;
  }

  private validateRule(ruleDefinition: RuleDefinition) {
    // TODO: validate rule definiton
  }

  private generateQniqName(): string {
    nameIndex++;

    return String(nameIndex);
  }

}
