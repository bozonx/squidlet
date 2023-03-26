import IoSet from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoSet.js';
import IoItem from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';
import Storage from '../../../squidlet-networking/src/io/nodejs/ios/Storage';
import StorageEnvMemoryWrapper from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/StorageEnvMemoryWrapper.js';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import StorageIo from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import {PATH_SEP} from '../../../squidlet-lib/src/paths';
import systemConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';
import {EntityTypePlural} from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import {trimChar} from '../../../squidlet-lib/src/strings';


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
    devicesMainClasses: {[index: string]: any} = {},
    driversMainClasses: {[index: string]: any} = {},
    servicesMainClasses: {[index: string]: any} = {}
  ) {
    this.ioClasses = ioClasses;
    this.storageWrapper = new StorageEnvMemoryWrapper(envSet);
    this.mainFiles.devices = devicesMainClasses;
    this.mainFiles.drivers = driversMainClasses;
    this.mainFiles.services = servicesMainClasses;
  }


  /**
   * Load ioSet index.js file where included all the used platforms on platform.
   * It will be called on system start
   */
  async init(): Promise<void> {
    // make dev instances
    for (let ioName of Object.keys(this.ioClasses)) {
      this.ioCollection[ioName] = this.instantiateIo(ioName, this.ioClasses[ioName]);
    }
  }

  async destroy() {
    // destroy of ios
    const ioNames: string[] = this.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

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
    if (!fileName || fileName.indexOf(systemConfig.rootDirs.envSet) !== 0) {
      throw new Error(`IoSetBuiltin.requireLocalFile: Bad file name "${fileName}:`);
    }

    const splat: string[] = trimChar(fileName, PATH_SEP).split(PATH_SEP);

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

    return { default: this.mainFiles[pluralType][entityName] };
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
