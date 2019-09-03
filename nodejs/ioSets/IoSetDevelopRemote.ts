import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';
import StorageEnvMemoryWrapper from './StorageEnvMemoryWrapper';
import RemoteIoCollection from './RemoteIoCollection';
import Os from '../../shared/Os';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {checkIoExistance} from '../../hostEnvBuilder/helpers';


/**
 * It uses IOs of remote host.
 */
export default class IoSetDevelopRemote implements IoSet {
  private readonly os: Os;
  private readonly envBuilder: EnvBuilder;
  private readonly remoteIoNames: string[];
  private readonly storageWrapper: StorageEnvMemoryWrapper;
  private wrappedStorageIo?: StorageIo;
  private remoteIoCollection: RemoteIoCollection;


  constructor(
    os: Os,
    envBuilder: EnvBuilder,
    remoteIoNames: string[],
    host?: string,
    port?: number
  ) {
    this.os = os;
    this.envBuilder = envBuilder;
    this.remoteIoNames = remoteIoNames;
    this.storageWrapper = new StorageEnvMemoryWrapper(envBuilder);
    this.remoteIoCollection = new RemoteIoCollection(this.remoteIoNames, host, port);
  }

  async prepare() {
    await this.storageWrapper.init();
  }

  async init() {
    await this.remoteIoCollection.init();

    // check io dependencies
    checkIoExistance(this.envBuilder.usedEntities.getUsedIo(), this.remoteIoNames);

    this.wrappedStorageIo = this.storageWrapper.makeWrapper(
      this.remoteIoCollection.getIo('Storage') as StorageIo
    );
  }

  async destroy() {
    await this.remoteIoCollection.destroy();
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (ioName === 'Storage') {
      return this.wrappedStorageIo as any;
    }
    else if (!this.remoteIoCollection.getIo(ioName)) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.remoteIoCollection.getIo(ioName) as T;
  }

  getNames(): string[] {
    return this.remoteIoNames;
  }

}
