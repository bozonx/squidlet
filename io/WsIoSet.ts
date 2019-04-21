import IoSet from '../system/interfaces/IoSet';


// class WsIoInstance {
//   constructor() {
//
//   }
// }




export default class WsIoSet implements IoSet {
  private readonly instances: {[index: string]: any} = {};

  constructor(ioDefinitions: {[index: string]: string[]}) {
    for (let ioName of Object.keys(ioDefinitions)) {
      this.instances[ioName] = {};

      for (let methodName of ioDefinitions[ioName]) {
        this.instances[ioName][methodName] = (...args: any[]): Promise<any> => {
          let praparedProps: any[];

          for (let arg of args) {
            if (typeof arg === 'function') {
              // TODO: make callback id
              praparedProps.push(this.makeCallBackId(args));
            }
            else {
              praparedProps.push(arg);
            }

          }


        };
      }
    }
  }


  makeCallBackId(cb: any): string {
    // TODO: do it
  }

  // getInstance<T>(devName: string): T {
  //   if (this.instances[devName]) return this.instances[devName] as T;
  //
  //   this.instances[devName] = new WsIoInstance();
  //
  //   return this.instances[devName] as T;
  // }

}
