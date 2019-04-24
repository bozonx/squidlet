import System from '../System';
import RemoteCall from '../helpers/RemoteCall';
import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../interfaces/RemoteCallMessage';
import {isPlainObject} from '../helpers/lodashLike';
import IoItem from '../interfaces/IoItem';
import IoItemDefinition from '../interfaces/IoItemDefinition';


export default abstract class RemoteIoBase {
  private _system?: System;
  private _remoteCall?: RemoteCall;
  private readonly ioCollection: {[index: string]: IoItem} = {};
  private get remoteCall(): RemoteCall {
    return this.remoteCall as any;
  }
  protected get system(): System {
    return this._system as any;
  }

  // send a message to server
  protected abstract send(message: RemoteCallMessage): any;


  async init(system: System): Promise<void> {
    this._remoteCall = new RemoteCall(
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


  async configureAllIo(): Promise<void> {
    // TODO: call init functions of all the io.
  }


  getInstance<T extends IoItem>(ioName: string): T {
    if (this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
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


  private makeInstances(ioItemDefinition: IoItemDefinition) {
    for (let ioName of Object.keys(ioItemDefinition)) {
      this.ioCollection[ioName] = {};

      for (let methodName of ioItemDefinition[ioName]) {
        this.ioCollection[ioName][methodName] = this.makeMethod(ioName, methodName);
      }
    }
  }

  private makeMethod(ioName: string, methodName: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      return this.remoteCall.callMethod(ioName, methodName, ...args);
    };
  }


}
