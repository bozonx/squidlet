import IoSet, {IoDefinition} from '../system/interfaces/IoSet';
import System from '../system/System';
import {Primitives} from '../system/interfaces/Types';


export default abstract class RemoteIoBase implements IoSet {
  protected readonly system: System;
  private readonly instances: {[index: string]: any} = {};
  private readonly callBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};


  abstract callMethod(ioName: string, methodName: string, ...args: Primitives[]): Promise<any>;
  abstract addCbListener(ioName: string): Promise<void>;
  abstract removeCbListener(ioName: string): Promise<void>;
  abstract destroy(): void;


  constructor(system: System) {
    this.system = system;
  }


  async init(ioDefinitions: IoDefinition): Promise<void> {
    this.makeInstances(ioDefinitions);
  }


  getInstance<T>(ioName: string): T {
    if (this.instances[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.instances[ioName] as T;
  }


  protected makeInstances(ioDefinitions: IoDefinition) {
    for (let ioName of Object.keys(ioDefinitions)) {
      this.instances[ioName] = {};

      for (let methodName of ioDefinitions[ioName]) {
        this.instances[ioName][methodName] = this.makeMethod();
      }
    }
  }

  protected makeMethod() {
    return async (...args: any[]): Promise<any> => {
      const praparedProps: any[] = [];

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

  protected makeCallBackId(cb: any): string {
    // TODO: do it
  }

}
