import DeviceBase from 'system/base/DeviceBase';
import ActionItem from '../interfaces/ActionItem';
import {ActionDefinition} from '../interfaces/RuleDefinition';
import {RuleActions} from '../rule/RuleActions';
import ValueDefinition from '../interfaces/ValueDefinition';
import {makeValue} from '../values/allValues';
import {JsonTypes} from '../../../../system/interfaces/Types';


interface DeviceActionDefinition extends ActionDefinition {
  // device id
  id: string;
  // name of action
  action: string;
  // means AND condition
  if: ValueDefinition[];
  // parameters which will be sent to the action
  values?: string[];
}


export default class DeviceAction implements ActionItem {
  private readonly actions: RuleActions;
  private readonly definition: DeviceActionDefinition;


  constructor(actions: RuleActions, definition: ActionDefinition) {
    this.validate(definition);

    this.actions = actions;
    this.definition = definition as DeviceActionDefinition;
  }

  destroy(): void {
  }


  async execute() {
    // do nothing if condition is false
    if (!this.checkCondition()) return;

    const device: DeviceBase = this.actions.context.system.devicesactions.getDevice(this.definition.id);
    const args: any[] = await this.makeArgs();

    this.actions.context.log.debug(
      `Automation: executing device action: ` +
      `${this.definition.id}.${this.definition.action} with args: ${JSON.stringify(args)}`
    );

    device.action(this.definition.action, ...args)
      .catch(this.actions.context.log.error);
  }


  private async makeArgs(): Promise<any[]> {
    if (typeof this.definition.values === 'undefined') return [];

    const promises: Promise<any>[] = [];

    for (let valueDefinition of this.definition.values) {
      promises.push(makeValue(this.actions.context, valueDefinition));
    }

    return Promise.all(promises);
  }

  private async checkCondition(): Promise<boolean> {
    if (!this.definition.if) return false;

    for (let valueDefinition of this.definition.if) {
      // TODO: поидее порядок выполнения не важен поэтому можно все выполнить одновременно
      //  и кто первый вернет false тогда считаем false

      const result: JsonTypes | undefined = await makeValue(this.actions.context, valueDefinition);

      if (!result) return false;
    }

    return true;
  }

  private validate(definition: ActionDefinition) {
    // TODO: validate
  }

}
