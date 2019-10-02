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
  private readonly triggers: RuleTriggers;
  private readonly definition: DeviceStateDefinition;
  private handlersIndexes: number[] = [];


  constructor(triggers: RuleTriggers, definition: TriggerDefinition) {
    this.validate(definition);

    this.triggers = triggers;
    this.definition = definition as DeviceStateDefinition;
  }


  onTrigger(cb: () => void): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (
        category !== StateCategories.devicesStatus
        || stateName !== this.definition.id
      ) return;

      if (this.definition.state && !changedParams.includes(this.definition.state)) return;

      cb();
    };

    const handlerIndex: number = this.triggers.context.state.onChange(handlerWrapper);

    this.handlersIndexes.push(handlerIndex);

    return handlerIndex;
  }

  destroy(): void {
    for (let handlerIndex of this.handlersIndexes) {
      this.triggers.context.state.removeListener(handlerIndex);
    }

    delete this.handlersIndexes;
  }


  private validate(definition: TriggerDefinition) {
    // TODO: validate
  }

}
