import * as path from 'path';

import System from '../../system/System';
import RemoteCall from '../../system/helpers/remoteCall/RemoteCall';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import IoItem from '../../system/interfaces/IoItem';
import BackdoorClient from '../../shared/BackdoorClient';
import {SYSTEM_DIR} from '../starter/helpers';
import categories from '../../system/dict/categories';
import {BACKDOOR_ACTION, BackdoorMessage} from '../../entities/services/Backdoor/Backdoor';


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

    // listen income messages of remoteCall
    await this.client.addListener(categories.ioSet, undefined);
    this.client.onIncomeMessage((message: BackdoorMessage) => {
      if (
        message.action !== BACKDOOR_ACTION.listenerResponse
        || message.payload.category !== categories.ioSet
      ) return;
      // pass message to remoteCall
      this.remoteCall.incomeMessage(message.payload.data)
        .catch(system.log.error);
    });

    const ioNames: string[] = await this.askIoNames();

    // make fake io items
    for (let ioName of ioNames) {
      this.ioCollection[ioName] = this.makeFakeIo(ioName);
    }
  }

  async destroy() {

    // TODO: review

    await this.remoteCall.destroy();
    await this.client.destroy();
  }


  private sendMessage(message: RemoteCallMessage): Promise<void> {

    // TODO: нужно ли указывать топик ???

    return this.client.emit(categories.ioSet, undefined, message);
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
