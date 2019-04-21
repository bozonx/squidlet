import IoSet, {IoDefinition} from '../system/interfaces/IoSet';
import System from '../system/System';
import {Primitives} from '../system/interfaces/Types';
import IndexedEvents from '../system/helpers/IndexedEvents';


type ResultHandler = (resultIoName: string, resultMethod: string, err: string | null, data: any) => void;


export default abstract class RemoteIoBase implements IoSet {
  protected readonly resultMessages = new IndexedEvents<ResultHandler>();
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

  /**
   * Wait while response of method is received
   */
  protected waitForCallResponse(ioName: string, method: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let wasFulfilled: boolean = false;
      let handlerIndex: number;
      const handler = (resultIoName: string, resultMethod: string, err: string | null, data: any) => {
        if (ioName !== resultIoName || resultMethod !== method) return;

        wasFulfilled = true;
        this.resultMessages.removeListener(handlerIndex);

        if (err) {
          return reject(new Error(err));
        }

        resolve(data);
      };

      handlerIndex = this.resultMessages.addListener(handler);

      setTimeout(() => {
        if (wasFulfilled) return;

        this.resultMessages.removeListener(handlerIndex);
        reject(`Remote dev set request timeout has been exceeded.`);
      }, this.system.host.config.config.devSetResponseTimout);
    });
  }

}
