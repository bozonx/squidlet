import * as path from 'path';

import IoItem from '../../../system/interfaces/IoItem';
import {SYSTEM_DIR} from '../../../shared/helpers/helpers';
import IoClient from '../../../shared/helpers/IoClient';
import {consoleError} from '../../../system/lib/helpers';


export default class RemoteIoCollection {
  private ioCollection: {[index: string]: IoItem} = {};
  private readonly remoteIoNames: string[];
  private readonly host?: string;
  private readonly port?: number;
  private _ioClient?: IoClient;
  private get ioClient(): IoClient {
    return this._ioClient as any;
  }


  constructor(remoteIoNames: string[], host?: string, port?: number) {
    this.host = host;
    this.port = port;
    this.remoteIoNames = remoteIoNames;
  }


  async init(): Promise<void> {
    this._ioClient = new IoClient(
      console.log,
      console.info,
      consoleError,
      this.host,
      this.port
    );

    await this.ioClient.init();

    // make fake platforms items
    for (let ioName of this.remoteIoNames) {
      this.ioCollection[ioName] = this.makeFakeIo(ioName);
    }
  }

  async destroy() {
    await this.ioClient.destroy();
    delete this._ioClient;
    delete this.ioCollection;
  }


  getIo(ioName: string): IoItem | undefined {
    return this.ioCollection[ioName];
  }


  private makeFakeIo(ioName: string): IoItem {
    const ioDefinitionPath = path.join(SYSTEM_DIR, 'interfaces', 'platforms', `${ioName}Io`);
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