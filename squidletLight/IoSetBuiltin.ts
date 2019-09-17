import IoSet from '../system/interfaces/IoSet';
import IoItem from '../system/interfaces/IoItem';
//import HttpServer from '../nodejs/ios/HttpServer';
import Storage from '../nodejs/ios/Storage';
// import Sys from '../lowjs/ios/Sys';
// import WebSocketServer from '../nodejs/ios/WebSocketServer';
// import WebSocketClient from '../nodejs/ios/WebSocketClient';
import StorageEnvMemoryWrapper from '../shared/StorageEnvMemoryWrapper';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
//import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';
import StorageIo from '../system/interfaces/io/StorageIo';
import {PATH_SEP} from '../system/lib/paths';
import systemConfig from '../system/systemConfig';
import {EntityTypePlural} from '../system/interfaces/EntityTypes';
// import I2cMaster from '../lowjs/ios/I2cMaster';
// import Digital from '../lowjs/ios/Digital';
// import Serial from '../lowjs/ios/Serial';
//import Mqtt from '../nodejs/ios/Mqtt';

//
// // TODO: remake
// const ioClasses: {[index: string]: any} = {
//   //HttpClient,
//   HttpServer,
//   Storage,
//   Sys,
//   WebSocketClient,
//   WebSocketServer,
//   I2cMaster,
//   Digital,
//   Serial,
//   //Mqtt,
// };
// // TODO: remake
// const envSet: HostEnvSet = {
//   configs: {
//     config: {
//       id: 'lowjs-test',
//       platform: 'lowjs',
//       machine: 'esp32wrover',
//       ...hostDefaultConfig,
//       ioServer: {
//         ...hostDefaultConfig.ioServer,
//         host: '0.0.0.0',
//       },
//     },
//     systemDrivers: [],
//     regularDrivers: [],
//     systemServices: [],
//     regularServices: [],
//     devicesDefinitions: [],
//     driversDefinitions: {},
//     servicesDefinitions: {},
//     iosDefinitions: {},
//   },
//   entities: {
//     devices: {},
//     drivers: {},
//     services: {},
//   }
// };

interface MainFiles {
  devices: {[index: string]: any};
  drivers: {[index: string]: any};
  services: {[index: string]: any};
}


export default class IoSetBuiltin implements IoSet {
  private readonly ioClasses: {[index: string]: any};
  private readonly mainFiles: MainFiles = {
    devices: {},
    drivers: {},
    services: {},
  };
  private ioCollection: {[index: string]: IoItem} = {};
  private readonly storageWrapper: StorageEnvMemoryWrapper;


  constructor(
    envSet: HostEnvSet,
    ioClasses: {[index: string]: any},
    devicesMainClasses: {[index: string]: any},
    driversMainClasses: {[index: string]: any},
    servicesMainClasses: {[index: string]: any}
  ) {
    this.ioClasses = ioClasses;
    this.storageWrapper = new StorageEnvMemoryWrapper(envSet);
    this.mainFiles.devices = devicesMainClasses;
    this.mainFiles.drivers = driversMainClasses;
    this.mainFiles.services = servicesMainClasses;
  }


  /**
   * Load ioSet index.js file where included all the used io on platform.
   * It will be called on system start
   */
  async init(): Promise<void> {
    // make dev instances
    for (let ioName of Object.keys(this.ioClasses)) {
      this.ioCollection[ioName] = this.instantiateIo(ioName, this.ioClasses[ioName]);
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

  async requireLocalFile(fileName: string): Promise<any> {
    console.log(111111111, fileName);

    if (!fileName || fileName.indexOf(systemConfig.rootDirs.envSet) !== 0) {
      throw new Error(`IoSetBuiltin.requireLocalFile: Bad file name "${fileName}:`);
    }

    const splat: string[] = fileName.split(PATH_SEP);

    if (splat.length !== 5) {
      throw new Error(`IoSetBuiltin.requireLocalFile: Can't parse file name "${fileName}"`);
    }
    else if (splat[1] !== systemConfig.envSetDirs.entities) {
      throw new Error(`IoSetBuiltin.requireLocalFile: Supported only loading of main files. "${fileName}"`);
    }
    else if (!['devices', 'drivers', 'services'].includes(splat[2])) {
      throw new Error(`IoSetBuiltin.requireLocalFile: Supported only loading of main files. "${fileName}"`);
    }

    const pluralType: EntityTypePlural = splat[2] as any;
    const entityName: string = splat[3];

    if (!this.mainFiles[pluralType][entityName]) {
      throw new Error(`IoSetBuiltin.requireLocalFile: Can't the file "${fileName}"`);
    }

    return this.mainFiles[pluralType][entityName];
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
