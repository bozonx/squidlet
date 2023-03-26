import Context from 'Context';
import DeviceBase from 'base/DeviceBase';
import runExpr from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/automation/expressionHelper.js';


export default class ExpressionManager {
  private readonly context: Context;
  private readonly scope: {[index: string]: any};


  constructor(context: Context) {
    this.context = context;
    this.scope = this.makeScope();
  }


  async execute(expression: string): Promise<any> {
    // TODO: без await в выражениях сложные выражения будут работать некорректно
    return await runExpr(expression, this.scope);
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
