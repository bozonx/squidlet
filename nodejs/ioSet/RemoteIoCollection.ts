import * as path from 'path';

import System from '../../system/System';
import RemoteCall from '../../system/helpers/remoteCall/RemoteCall';
import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../../system/interfaces/RemoteCallMessage';
import {isPlainObject} from '../../system/helpers/lodashLike';
import IoItem from '../../system/interfaces/IoItem';
import BackdoorClient from '../../shared/BackdoorClient';
import {SYSTEM_DIR} from '../starter/helpers';
import categories from '../../system/dict/categories';
import topics from '../../system/dict/topics';


export default class RemoteIoCollection {
  readonly ioCollection: {[index: string]: IoItem} = {};

  private _remoteCall?: RemoteCall;
  private get remoteCall(): RemoteCall {
    return this._remoteCall as any;
  }
  private readonly client: BackdoorClient;


  constructor(host?: string, port?: number) {
    this.client = new BackdoorClient(host, port);
  }


  /**
   * Replace init method to generate local proxy methods and instantiate RemoteCall
   */
  async init(system: System): Promise<void> {
    this._remoteCall = new RemoteCall(
      this.sendMessage,
      undefined,
      system.host.config.config.ioSetResponseTimoutSec,
      system.log.error,
      system.host.generateUniqId
    );

    // TODO: listen messages
    // this.client.onIncomeMessage(this.resolveIncomeMessage);

    const ioNames: string[] = await this.askIoNames();

    // make fake io items
    for (let ioName of ioNames) {
      this.ioCollection[ioName] = this.makeFakeIo(ioName);
    }
  }

  async destroy() {
    await this.remoteCall.destroy();
    await this.client.destroy();
  }


  private sendMessage(message: RemoteCallMessage): Promise<void> {

    // TODO: нужно ли указывать топик ???

    return this.client.emit(categories.ioSet, undefined, message);
  }

  /**
   * Call this method when you has received a message
   */
  protected resolveIncomeMessage = async (message: {[index: string]: any}) => {
    if (!isPlainObject(message)) {
      return this.system.log.error(`Io set: received message is not an object`);
    }
    else if (!message.type || !REMOTE_CALL_MESSAGE_TYPES.includes(message.type)) {
      return this.system.log.error(`Io set: incorrect type of message ${JSON.stringify(message)}`);
    }

    await this.remoteCall.incomeMessage(message);
  }

  private async askIoNames(): Promise<string[]> {
    // TODO: ask for io list
  }

  private makeFakeIo(ioName: string): IoItem {
    const ioDefinitionPath = path.join(SYSTEM_DIR, 'interfaces', 'io', `${ioName}Io`);
    const ioItem: {[index: string]: any} = {};
    let ioMethods: string[];

    try {
      ioMethods = require(ioDefinitionPath).Methods;
    }
    catch (err) {
      throw new Error(`Can't find methods of io "${ioName}"`);
    }

    for (let methodName of ioMethods) {
      // skip init and configure methods because io item has already initialized and configured on a host
      if (methodName === 'init' || methodName === 'configure') continue;

      ioItem[methodName] = this.makeMethod(ioName, methodName);
    }

    return ioItem as IoItem;
  }

  private makeMethod(ioName: string, methodName: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      return this.remoteCall.callMethod(ioName, methodName, ...args);
    };
  }

}
