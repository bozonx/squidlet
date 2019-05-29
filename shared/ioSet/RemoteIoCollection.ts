import * as path from 'path';

import System from '../../system/System';
import IoItem from '../../system/interfaces/IoItem';
import {SYSTEM_DIR} from '../helpers';
import WsApiClient from '../WsApiClient';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';


// TODO: remove
let uniqIdIndex = 0;


export default class RemoteIoCollection {
  ioCollection: {[index: string]: IoItem} = {};
  ioNames: string[] = [];

  private readonly client: WsApiClient;
  private _system?: System;
  private get system(): System {
    return this._system as any;
  }


  constructor(host?: string, port?: number) {
    // TODO: review - может перенсти в init - но проверить чтобы соединилось до использования io
    this.client = new WsApiClient(
      hostDefaultConfig.config.ioSetResponseTimoutSec,
      console.info,
      console.error,
      this.system.generateUniqId,
      host,
      port
    );
  }


  async init(system: System): Promise<void> {
    this._system = system;
    await this.client.init();

    this.ioNames = await this.askIoNames();

    // make fake io items
    for (let ioName of this.ioNames) {
      this.ioCollection[ioName] = this.makeFakeIo(ioName);
    }
  }

  async destroy() {
    //this.ioCollection = {};
    delete this.ioNames;
    //await this.remoteCall.destroy();
    await this.client.destroy();
  }


  private async askIoNames(): Promise<string[]> {
    return this.client.callMethod('getIoNames');
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
      return this.client.callMethod(ioName, methodName, ...args);
    };
  }

  private generateUniqId = (): string => {

    // TODO: use real uniq id

    uniqIdIndex++;

    return String(uniqIdIndex);
  }

}
