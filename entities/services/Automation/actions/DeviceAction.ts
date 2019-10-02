import DeviceBase from 'system/base/DeviceBase';
import ActionItem from '../interfaces/ActionItem';
import {ActionDefinition} from '../interfaces/RuleDefinition';
import {RuleActions} from '../rule/RuleActions';
import ConditionDefinition from '../interfaces/ConditionDefinition';


interface DeviceActionDefinition extends ActionDefinition {
  // device id
  id: string;
  // name of action
  action: string;
  if: ConditionDefinition[];
  // parameters which will be sent to the action
  value?: string[];
}


export default class DeviceAction implements ActionItem {
  private readonly manager: RuleActions;
  private readonly definition: DeviceActionDefinition;


  constructor(manager: RuleActions, definition: ActionDefinition) {
    this.validate(definition);

    this.manager = manager;
    this.definition = definition as DeviceActionDefinition;
  }

  destroy(): void {
    // TODO: add !!!!!
  }


  async execute() {
    const device: DeviceBase = this.manager.context.system.devicesManager.getDevice(this.definition.id);
    const args: any[] = await this.makeArgs();

    this.manager.context.log.debug(
      `Automation: executing device action: ` +
      `${this.definition.id}.${this.definition.action} with args: ${JSON.stringify(args)}`
    );

    device.action(this.definition.action, ...args)
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
