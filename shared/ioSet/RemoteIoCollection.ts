import * as path from 'path';

import IoItem from '../../system/interfaces/IoItem';
import {SYSTEM_DIR} from '../helpers';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import IoServerClient from '../IoServerClient';


export default class RemoteIoCollection {
  private ioCollection: {[index: string]: IoItem} = {};
  private ioNames: string[] = [];
  private readonly host?: string;
  private readonly port?: number;
  private _client?: IoServerClient;
  private get ioClient(): IoServerClient {
    return this._client as any;
  }


  constructor(host?: string, port?: number) {
    this.host = host;
    this.port = port;
  }


  async init(): Promise<void> {
    this._client = new IoServerClient(
      hostDefaultConfig.config.ioSetResponseTimoutSec,
      console.info,
      console.error,
      this.host,
      this.port
    );

    await this.ioClient.init();

    this.ioNames = await this.ioClient.getIoNames();

    // make fake io items
    for (let ioName of this.ioNames) {
      this.ioCollection[ioName] = this.makeFakeIo(ioName);
    }
  }

  async destroy() {
    await this.ioClient.destroy();
    delete this._client;
    delete this.ioNames;
  }


  getIo(ioName: string): IoItem | undefined {
    return this.ioCollection[ioName];
  }

  getIoNames(): string[] {
    return this.ioNames;
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
      ioItem[methodName] = this.makeMethod(ioName, methodName);
    }

    return ioItem as IoItem;
  }

  private makeMethod(ioName: string, methodName: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      return this.ioClient.callIoMethod(ioName, methodName, ...args);
    };
  }

}
