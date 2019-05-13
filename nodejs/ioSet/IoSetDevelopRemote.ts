import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR, IOSET_STRING_DELIMITER} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import System from '../../system';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import RemoteIoCollection from './RemoteIoCollection';
import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import StorageEnvMemoryWrapper from './StorageEnvMemoryWrapper';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';


export default class IoSetDevelopRemote implements IoSet {
  private readonly os: Os;
  private readonly platform: Platforms;
  private readonly machine: string;
  private storageWrapper: StorageEnvMemoryWrapper;
  private ioCollection: {[index: string]: IoItem} = {};
  private remoteIoCollection = new RemoteIoCollection();

  // private wsClientProps: WsClientProps;
  // private _client?: WsClient;
  // private get client(): WsClient {
  //   return this._client as any;
  // }


  //private readonly envBuilder: EnvBuilder;
  private readonly paramsString: string;


  constructor(os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string, paramsString?: string) {
    if (!paramsString) {
      throw new Error(`IoSetDevelopRemote: paramsString has to be set`);
    }

    this.os = os;
    this.platform = platform;
    this.machine = machine;
    this.storageWrapper = new StorageEnvMemoryWrapper(envBuilder, envSetDir);
    this.paramsString = paramsString;
  }


  async prepare() {
    await this.storageWrapper.init();
  }

  async init(system: System) {
    await this.remoteIoCollection.init(system);

    for (let ioName of Object.keys(this.remoteIoCollection.items)) {
      if (ioName === 'Storage') {
        this.ioCollection[ioName] = this.storageWrapper.makeWrapper(
          this.remoteIoCollection.items[ioName] as StorageIo
        );
      }
      else {
        this.ioCollection[ioName] = this.remoteIoCollection.items[ioName];
      }
    }
  }

  async destroy() {
    await this.remoteIoCollection.destroy();
  }

  // getIo<T extends IoItem>(ioName: string): T {
  //   return this.ioCollection.getIo(ioName) as T;
  // }
  //
  // getNames(): string[] {
  //   return this.ioCollection.getNames();
  // }

  getIo<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

  getNames(): string[] {
    return Object.keys(this.ioCollection);
  }


  private parseIoSetString(ioSetString?: string): {host: string, port?: number} | undefined {
    if (!ioSetString) return;

    const splat = ioSetString.split(IOSET_STRING_DELIMITER);

    // TODO: set default port ???

    return {
      host: splat[0],
      port: splat[1] && parseInt(splat[1]) || undefined,
    };
  }

}
