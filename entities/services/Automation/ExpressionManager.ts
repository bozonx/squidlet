import {evaluate} from 'bcx-expression-evaluator';

import Context from 'system/Context';
import DeviceBase from 'system/base/DeviceBase';


export default class ExpressionManager {
  private readonly context: Context;
  private readonly scope: {[index: string]: any};


  constructor(context: Context) {
    this.context = context;
    this.scope = this.makeScope();
  }


  async execute(expression: string): Promise<any> {
    // TODO: без await в выражениях сложные выражения будут работать некорректно
    return await evaluate(expression, this.scope);
  }


  private makeScope(): {[index: string]: any} {
    return {
      getDeviceStatus: (id: string, paramName?: string): any => {
        const device: DeviceBase = this.context.system.devicesManager.getDevice(id);

        return device.getStatus(paramName);
      }
    };
  }

}
