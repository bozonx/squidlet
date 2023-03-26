import {StateCategories} from '__old/system/interfaces/States';

import TriggerItem from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/TriggerItem.js';
import {TriggerDefinition} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleDefinition.js';
import {RuleTriggers} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleTriggers.js';


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
    const handlerIndex: number = this.triggers.context.state.onChange(
      (category: number, stateName: string, changedParams: string[]) => {
        this.stateHandler(cb, category, stateName, changedParams);
      }
    );

    this.handlersIndexes.push(handlerIndex);

    return handlerIndex;
  }

  destroy(): void {
    for (let handlerIndex of this.handlersIndexes) {
      this.triggers.context.state.removeListener(handlerIndex);
    }

    delete this.handlersIndexes;
  }


  private stateHandler(cb: () => void, category: number, stateName: string, changedParams: string[]): void {
    if (category !== StateCategories.devicesStatus || stateName !== this.definition.id) {
      return;
    }

    // check only specified state name or allow any state change if "state" param isn't defined
    if (this.definition.state && !changedParams.includes(this.definition.state)) return;

    try {
      cb();
    }
    catch (err) {
      this.triggers.context.log.error(err);
    }
  }

  private validate(definition: TriggerDefinition) {
    // TODO: validate
  }

}
