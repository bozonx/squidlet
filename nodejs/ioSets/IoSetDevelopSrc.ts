import IoSet from '../../system/interfaces/IoSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import StorageEnvMemoryWrapper from './StorageEnvMemoryWrapper';
import StorageIo from '../../system/interfaces/io/StorageIo';
import IoSetSrc from './IoSetSrc';


/**
 * It gets configs and manifests from memory and uses source modules.
 */
export default class IoSetDevelopSrc extends IoSetSrc implements IoSet {
  private readonly storageWrapper: StorageEnvMemoryWrapper;


  constructor(os: Os, envBuilder: EnvBuilder) {
    super(os, platform, machine);

    this.storageWrapper = new StorageEnvMemoryWrapper(envBuilder);
  }

  async prepare() {
    await this.storageWrapper.init();
  }

  protected makeInstance(IoItemClass: new () => IoItem, ioName: string): IoItem {
    // make wrapper of Storage to get configs and manifests from memory
    if (ioName === 'Storage') {
      return this.storageWrapper.makeWrapper(new IoItemClass() as StorageIo);
    }
    else {
      return new IoItemClass();
    }
  }

}
