import Context from 'system/Context';


export default class ExpressionManager {
  private readonly context: Context;
  private readonly scope: {[index: string]: any};


  constructor(context: Context) {
    this.context = context;
    this.scope = this.makeScope();
  }


  async execute(expression: string): Promise<any> {
    // TODO: parse expression and pass scope to it
  }


  private makeScope(): {[index: string]: any} {
    return {
      getDeviceStatus: (id: string, paramName?: string) => {
        // TODO: !!!!
      }
    };
  }

}
