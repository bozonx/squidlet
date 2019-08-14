import * as path from 'path';

import Context from '../../system/Context';
import IoItem from '../../system/interfaces/IoItem';
import {SYSTEM_DIR} from '../helpers';
import WsApiClient from '../WsApiClient';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';


export default class RemoteIoCollection {
  ioCollection: {[index: string]: IoItem} = {};
  ioNames: string[] = [];

  private readonly host?: string;
  private readonly port?: number;
  private _client?: WsApiClient;
  private get client(): WsApiClient {
    return this._client as any;
  }


  constructor(host?: string, port?: number) {
    this.host = host;
    this.port = port;
  }


  async init(context: Context): Promise<void> {

    // TODO: system не нужен ???

    this._client = new WsApiClient(
      hostDefaultConfig.config.ioSetResponseTimoutSec,
      console.info,
      console.error,
      this.host,
      this.port
    );
    await this.client.init();

    this.ioNames = await this.askIoNames();

    // make fake io items
    for (let ioName of this.ioNames) {
      this.ioCollection[ioName] = this.makeFakeIo(ioName);
    }
  }

  async destroy() {
    await this.client.destroy();
    delete this._client;
    delete this.ioNames;
  }


  private async askIoNames(): Promise<string[]> {

    // TODO: use getHostInfo.usedIo

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

}
