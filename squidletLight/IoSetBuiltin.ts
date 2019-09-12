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
import StorageIo from '../system/interfaces/io/StorageIo';
import I2cMaster from '../lowjs/ios/I2cMaster';
import Digital from '../lowjs/ios/Digital';
//import Mqtt from '../nodejs/ios/Mqtt';


// TODO: remake
const ioClasses: {[index: string]: any} = {
  //HttpClient,
  HttpServer,
  Storage,
  Sys,
  WebSocketClient,
  WebSocketServer,
  I2cMaster,
  Digital,
  //Mqtt,
};
// TODO: remake
const envSet: HostEnvSet = {
  configs: {
    config: {
      id: 'lowjs-test',
      platform: 'lowjs',
      machine: 'esp32wrover',
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
      this.ioCollection[ioName] = this.instantiateIo(ioName, ioClasses[ioName]);
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


  private instantiateIo(ioName: string, IoItemClass: new () => IoItem): IoItem {
    // make wrapper of Storage to get configs and manifests from memory
    if (ioName === 'Storage') {
      return this.storageWrapper.makeWrapper(new IoItemClass() as StorageIo);
    }
    else {
      return new IoItemClass();
    }
  }

}
