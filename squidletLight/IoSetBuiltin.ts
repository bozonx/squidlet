import IoSet from '../system/interfaces/IoSet';
import IoItem from '../system/interfaces/IoItem';
import HttpServer from '../nodejs/ios/HttpServer';
import Storage from '../nodejs/ios/Storage';
import Sys from '../lowjs/ios/Sys';
import WebSocketServer from '../nodejs/ios/WebSocketServer';
import WebSocketClient from '../nodejs/ios/WebSocketClient';
import HttpClient from '../nodejs/ios/HttpClient';


// TODO: remake
const ioClasses: {[index: string]: any} = {
  HttpClient,
  HttpServer,
  Storage,
  Sys,
  WebSocketClient,
  WebSocketServer,
};


export default class IoSetBuiltin implements IoSet {
  private ioCollection: {[index: string]: IoItem} = {};


  /**
   * Load ioSet index.js file where included all the used io on platform.
   * It will be called on system start
   */
  async init(): Promise<void> {
    // make dev instances
    for (let ioName of Object.keys(ioClasses)) {
      this.ioCollection[ioName] = new ioClasses[ioName]();
    }
  }

  async destroy() {
    delete this.ioCollection;
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

  getNames(): string[] {
    return Object.keys(this.ioCollection);
  }

}
