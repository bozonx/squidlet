import * as path from 'path';

import System from '../../system/System';
import RemoteCall from '../../system/helpers/remoteCall/RemoteCall';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import IoItem from '../../system/interfaces/IoItem';
import BackdoorClient from '../../shared/BackdoorClient';
import {SYSTEM_DIR} from '../starter/helpers';
import categories from '../../system/dict/categories';
import topics from '../../system/dict/topics';


export default class RemoteIoCollection {
  readonly ioCollection: {[index: string]: IoItem} = {};

  private readonly client: BackdoorClient;
  private _system?: System;
  private _remoteCall?: RemoteCall;
  private get system(): System {
    return this._system as any;
  }
  private get remoteCall(): RemoteCall {
    return this._remoteCall as any;
  }


  constructor(host?: string, port?: number) {
    this.client = new BackdoorClient(host, port);
  }


  async init(system: System): Promise<void> {
    this._system = system;
    this._remoteCall = new RemoteCall(
      this.sendMessage,
      undefined,
      this.system.host.config.config.ioSetResponseTimoutSec,
      this.system.log.error,
      this.system.host.generateUniqId
    );

    // listen income messages of remoteCall
    await this.client.addListener(categories.ioSet, topics.ioSet.remoteCall, (data?: any) => {
      this.remoteCall.incomeMessage(data)
        .catch(this.system.log.error);
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


  // TODO: может работать с events а не с client???

  /**
   * Send message from remoteCall to other side (IoSetServer)
   */
  private sendMessage(message: RemoteCallMessage): Promise<void> {
    return this.client.emit(categories.ioSet, topics.ioSet.remoteCall, message);
  }

  private async askIoNames(): Promise<string[]> {
    return this.client.request(categories.ioSet, topics.ioSet.askIoNames);
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


//this.client.onIncomeMessage(this.handleBackDoorMessage);
// private handleBackDoorMessage(message: BackdoorMessage) {
//   if (
//     message.action !== BACKDOOR_ACTION.listenerResponse
//     || message.payload.category !== categories.ioSet
//   ) return;
//
//   if (message.payload.topic === topics.ioSet.remoteCall) {
//     // pass message to remoteCall
//     this.remoteCall.incomeMessage(message.payload.data)
//       .catch(this.system.log.error);
//   }
//   // else if (message.payload.topic === topics.ioSet.askIoNames) {
//   //   this.incomeIoNamesEvents.emit(message.payload.data);
//   // }
// }
