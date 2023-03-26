import DeviceBase from '__old/system/base/DeviceBase';

import ActionItem from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ActionItem.js';
import {ActionDefinition} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/RuleDefinition.js';
import {RuleActions} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/rule/RuleActions.js';
import ValueDefinition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ValueDefinition.js';
import {makeValue} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/allValues.js';
import AndValue from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/AndValue.js';


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
    // TODO: зачем оно асинхронное ???
    // do nothing if condition is false
    if (!await this.isAllowedExecute()) return;

    const device: DeviceBase = this.actions.context.system.devicesManager.getDevice(this.definition.id);
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

    // TODO: support of promises

    const result: any[] = [];

    for (let valueDefinition of this.definition.values) {
      result.push(await makeValue(this.actions.context, valueDefinition));
    }

    return result;

    // const promises: Promise<any>[] = [];
    //
    // for (let valueDefinition of this.definition.values) {
    //   // TODO: могут быть и не промисы
    //   promises.push(makeValue(this.actions.context, valueDefinition));
    // }
    //
    // return Promise.all(promises);
  }

  private async isAllowedExecute(): Promise<boolean> {

    // TODO: не обязательно должно венуть промис

    // allow execute if there isn't "if" section
    if (!this.definition.if) return true;

    return AndValue(this.actions.context, {
      type: 'and',
      check: this.definition.if,
    });
  }

  private validate(definition: ActionDefinition) {
    // TODO: validate
  }

}
