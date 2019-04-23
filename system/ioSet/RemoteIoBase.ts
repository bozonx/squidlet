import {IoDefinition, IoSetInstance, IoSetInstances} from '../interfaces/IoSet';
import System from '../System';
import RemoteCall from '../helpers/RemoteCall';
import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../interfaces/RemoteCallMessage';
import {isPlainObject} from '../helpers/lodashLike';


export default abstract class RemoteIoBase {
  private _system?: System;
  private readonly instances: IoSetInstances = {};
  private readonly remoteCall: RemoteCall;
  readonly get system(): System {
    return this._system as any;
  }

  // send a message to server
  protected abstract send(message: RemoteCallMessage): any;


  async init(system: System): Promise<void> {
    this.remoteCall = new RemoteCall(
      this.send,
      // TODO: add local methods ????
      {},
      this.system.host.id,
      this.system.host.config.config.devSetResponseTimout,
      this.system.log.error,
      this.system.host.generateUniqId
    );

    this._system = system;
    //this.makeInstances(ioDefinitions);
  }


  getInstance<T extends IoSetInstance>(ioName: string): T {
    if (this.instances[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.instances[ioName] as T;
  }


  /**
   * Call this method when you has received a message
   */
  protected async resolveIncomeMessage(message: RemoteCallMessage) {
    if (!isPlainObject(message)) {
      return this.system.log.error(`Io set: received message is not an object`);
    }
    else if (!message.type || !REMOTE_CALL_MESSAGE_TYPES.includes(message.type)) {
      return this.system.log.error(`Io set: incorrect type of message ${JSON.stringify(message)}`);
    }

    await this.remoteCall.incomeMessage(message);
  }


  private makeInstances(ioDefinitions: IoDefinition) {
    for (let ioName of Object.keys(ioDefinitions)) {
      this.instances[ioName] = {};

      for (let methodName of ioDefinitions[ioName]) {
        this.instances[ioName][methodName] = this.makeMethod(ioName, methodName);
      }
    }
  }

  private makeMethod(ioName: string, methodName: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      return this.remoteCall.callMethod(ioName, methodName, ...args);
    };
  }


}
