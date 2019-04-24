import System from '../System';
import RemoteCall from '../helpers/RemoteCall';
import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../interfaces/RemoteCallMessage';
import {isPlainObject} from '../helpers/lodashLike';
import IoItem from '../interfaces/IoItem';
import IoSetLocal from './IoSetLocal';


export default abstract class RemoteIoBase extends IoSetLocal {
  private _remoteCall?: RemoteCall;
  private get remoteCall(): RemoteCall {
    return this.remoteCall as any;
  }

  // send a message to server
  protected abstract send(message: RemoteCallMessage): any;


  /**
   * Replace init method to generate local proxy methods and instantiate RemoteCall
   */
  async init(system: System): Promise<void> {
    this._system = system;
    this._remoteCall = new RemoteCall(
      this.send,
      // client don't have any local methods
      {},
      this.system.host.id,
      this.system.host.config.config.devSetResponseTimout,
      this.system.log.error,
      this.system.host.generateUniqId
    );
    this.ioCollection = this.makeIoCollection();

    await this.initAllIo();
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


  private makeIoCollection(): {[index: string]: IoItem} {
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
