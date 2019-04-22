import {IoDefinition} from '../interfaces/IoSet';
import System from '../System';
import RemoteCallClient from '../helpers/RemoteCallClient';
import RemoteCallMessage from '../interfaces/RemoteCallMessage';


interface Instance {
  // method name: method()
  [index: string]: (...args: any[]) => Promise<any>;
}

interface Instances {
  // io name
  [index: string]: Instance;
}


export default abstract class RemoteIoBase {
  protected readonly system: System;
  private readonly instances: Instances = {};
  private readonly remoteCallClient: RemoteCallClient;

  // abstract callMethod(ioName: string, methodName: string, ...args: Primitives[]): Promise<any>;
  // abstract addCbListener(ioName: string): Promise<void>;
  // abstract removeCbListener(ioName: string): Promise<void>;
  // send a message to server
  protected abstract send(message: RemoteCallMessage): any;
  // listen whole income data from server
  protected abstract addListener(cb: (data: any) => void): number;
  // remove listening of income data from server
  protected abstract removeListener(handleIndex: number): void;
  abstract destroy(): void;


  constructor(system: System) {
    this.system = system;

    const client = {
      send: this.send,
      addListener: this.addListener,
      removeListener: this.removeListener,
    };

    this.remoteCallClient = new RemoteCallClient(
      client,
      this.system.host.id,
      this.system.host.config.config.devSetResponseTimout,
      this.system.host.generateUniqId
    );
  }


  async init(ioDefinitions: IoDefinition): Promise<void> {
    this.makeInstances(ioDefinitions);
  }


  getInstance<T extends Instance>(ioName: string): T {
    if (this.instances[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.instances[ioName] as T;
  }


  private makeInstances(ioDefinitions: IoDefinition) {
    for (let ioName of Object.keys(ioDefinitions)) {
      this.instances[ioName] = {};

      for (let methodName of ioDefinitions[ioName]) {
        this.instances[ioName][methodName] = this.makeMethod(ioName, methodName);
      }
    }
  }


  protected makeMethod(ioName: string, methodName: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      return this.remoteCallClient.callMethod(ioName, methodName, ...args);
    };
  }


  // protected resolveIncomeMessage(message: IoSetMessage) {
  //   if (message.type === 'result') {
  //     const payload = message.payload as ResultPayload;
  //
  //     this.resultMessages.emit(payload.ioName, payload.method, payload.error, payload.result);
  //   }
  // }

}
