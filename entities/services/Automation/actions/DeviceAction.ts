import DeviceBase from 'system/base/DeviceBase';
import ActionItem from '../interfaces/ActionItem';
import {ActionDefinition} from '../interfaces/RuleDefinition';
import {RuleActions} from '../rule/RuleActions';
import ValueDefinition from '../interfaces/ValueDefinition';
import {JsonTypes} from '../../../../system/interfaces/Types';
import allValues from '../values/allValues';


interface DeviceActionDefinition extends ActionDefinition {
  // device id
  id: string;
  // name of action
  action: string;
  if: ValueDefinition[];
  // parameters which will be sent to the action
  values?: string[];
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
  }


  async execute() {
    // do nothing if condition is false
    if (!this.checkCondition()) return;

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
    if (typeof this.definition.values === 'undefined') return [];

    const result: any[] = [];

    for (let valueDefinition of this.definition.values) {
      result.push(await this.makeValue(valueDefinition));
    }

    return result;
  }

  private makeValue(valueDefinition: any): JsonTypes | undefined {
    if (!allValues[valueDefinition.type]) {
      throw new Error(`Automation DeviceAction: can't find a value function of "${valueDefinition.type}"`);
    }


  }

  private checkCondition(): boolean {
    // TODO: add
  }

  private validate(definition: ActionDefinition) {
    // TODO: validate
  }

}
