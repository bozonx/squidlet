import DeviceBase from 'system/base/DeviceBase';
import ActionItem from '../interfaces/ActionItem';
import {ActionDefinition} from '../interfaces/RuleDefinition';
import {ActionsManager} from '../ActionsManager';


interface DeviceActionDefinition extends ActionDefinition {
  // device id
  id: string;
  // name of action
  action: string;
  // javascript expression or a list of expressions
  params?: string | string[];
}


export default class DeviceAction implements ActionItem {
  private readonly manager: ActionsManager;
  private readonly definition: DeviceActionDefinition;


  constructor(manager: ActionsManager, definition: ActionDefinition) {
    this.validate(definition);

    this.manager = manager;
    this.definition = definition as DeviceActionDefinition;
  }


  execute() {
    const device: DeviceBase = this.manager.context.system.devicesManager.getDevice(this.definition.id);

    device.action(this.definition.action, ...await this.makeArgs())
      .catch(this.manager.context.log.error);
  }


  private async makeArgs(): Promise<any[]> {
    const result: any[] = [];

    if (typeof this.definition.params === 'undefined') {
      return [];
    }
    else if (typeof this.definition.params === 'string') {
      result.push(await this.manager.expressionManager.execute(this.definition.params));
    }
    else {
      for (let expr of this.definition.params) {
        result.push(await this.manager.expressionManager.execute(expr));
      }
    }

    return result;
  }

  private validate(definition: ActionDefinition) {
    // TODO: validate
  }

}
