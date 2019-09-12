import {StateCategories} from 'system/interfaces/States';
import TriggerItem from '../interfaces/TriggerItem';
import {TriggerDefinition} from '../interfaces/RuleDefinition';
import {TriggersManager} from '../TriggersManager';


export default class DeviceState implements TriggerItem {
  private readonly manager: TriggersManager;
  private readonly definition: TriggerDefinition;


  constructor(manager: TriggersManager, definition: TriggerDefinition) {
    this.manager = manager;
    this.definition = definition;
  }


  onSwitch(cb: () => void): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesStatus) return;
    };

    return this.manager.context.state.onChange(handlerWrapper);
  }

}
