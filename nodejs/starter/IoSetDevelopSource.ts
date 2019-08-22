import IoSet from '../../system/interfaces/IoSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import StorageEnvMemoryWrapper from '../../shared/ioSet/StorageEnvMemoryWrapper';
import StorageIo from '../../system/interfaces/io/StorageIo';
import IoSetBase from './IoSetBase';


/**
 * It gets configs and manifests from memory and uses source modules.
 */
export default class IoSetDevelopSource extends IoSetBase implements IoSet {
  private readonly storageWrapper: StorageEnvMemoryWrapper;


  constructor(os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string) {
    super(os, envSetDir, platform, machine);

    this.storageWrapper = new StorageEnvMemoryWrapper(envBuilder, envSetDir);
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
