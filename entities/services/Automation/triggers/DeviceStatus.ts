import {StateCategories} from 'system/interfaces/States';
import TriggerItem from '../interfaces/TriggerItem';
import {TriggerDefinition} from '../interfaces/RuleDefinition';
import {RuleTriggers} from '../rule/RuleTriggers';


interface DeviceStateDefinition extends TriggerDefinition {
  // device id
  id: string;
  // if state param isn't defined it means any state. If defined - then check specified param
  state?: string;
}


export default class DeviceStatus implements TriggerItem {
  private readonly manager: RuleTriggers;
  private readonly definition: DeviceStateDefinition;


  constructor(manager: RuleTriggers, definition: TriggerDefinition) {
    this.validate(definition);

    this.manager = manager;
    this.definition = definition as DeviceStateDefinition;
  }


  onTrigger(cb: () => void): number {

    // TODO: может делать через device

    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (
        category !== StateCategories.devicesStatus
        || stateName !== this.definition.id
      ) return;

      if (this.definition.state && !changedParams.includes(this.definition.state)) return;

      cb();
    };

    return this.manager.context.state.onChange(handlerWrapper);
  }


  private validate(definition: TriggerDefinition) {
    // TODO: validate
  }

}
