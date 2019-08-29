import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import HostConfig from '../../system/interfaces/HostConfig';
import IoSetSrc from './IoSetSrc';
import StorageIo from '../../system/interfaces/io/StorageIo';


/**
 * Io set which is used in standalone IO server.
 * It just gets host config from memory.
 */
export default class IoSetStandaloneIoServer extends IoSetSrc implements IoSet {
  private readonly hostConfig: HostConfig;


  constructor(os: Os, hostConfig: HostConfig, platform: Platforms, machine: string) {
    super(os, platform, machine);

    this.hostConfig = hostConfig;
  }

  async prepare() {
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
