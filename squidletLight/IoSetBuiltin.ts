import IoSet from '../system/interfaces/IoSet';
import IoItem from '../system/interfaces/IoItem';
import HttpServer from '../nodejs/ios/HttpServer';
import Storage from '../nodejs/ios/Storage';
import Sys from '../lowjs/ios/Sys';
import WebSocketServer from '../nodejs/ios/WebSocketServer';
import WebSocketClient from '../nodejs/ios/WebSocketClient';
import StorageEnvMemoryWrapper from '../shared/StorageEnvMemoryWrapper';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';
// import HttpClient from '../nodejs/ios/HttpClient';


// TODO: remake
const ioClasses: {[index: string]: any} = {
  //HttpClient,
  HttpServer,
  Storage,
  Sys,
  WebSocketClient,
  WebSocketServer,
};
// TODO: remake
const envSet: HostEnvSet = {
  configs: {
    config: {
      id: 'lowjs-test',
      platform: 'lowjs',
      machine: 'esp32',
      ...hostDefaultConfig,
      ioServer: {
        ...hostDefaultConfig.ioServer,
        host: '0.0.0.0',
      },
    },
    systemDrivers: [],
    regularDrivers: [],
    systemServices: [],
    regularServices: [],
    devicesDefinitions: [],
    driversDefinitions: {},
    servicesDefinitions: {},
    iosDefinitions: {},
  },
  entities: {
    devices: {},
    drivers: {},
    services: {},
  }
};


export default class IoSetBuiltin implements IoSet {
  private ioCollection: {[index: string]: IoItem} = {};
  private readonly storageWrapper: StorageEnvMemoryWrapper;


  constructor() {
    this.storageWrapper = new StorageEnvMemoryWrapper(envSet);
  }


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
