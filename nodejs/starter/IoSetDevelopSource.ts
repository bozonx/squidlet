import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import {loadMachineConfigInPlatformDir, getFileNameOfPath, resolvePlatformDir} from '../../shared/helpers';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import StorageEnvMemoryWrapper from '../../shared/ioSet/StorageEnvMemoryWrapper';
import StorageIo from '../../system/interfaces/io/StorageIo';


/**
 * It gets configs and manifests from memory and uses source modules.
 */
export default class IoSetDevelopSource implements IoSet {
  private readonly os: Os;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly storageWrapper: StorageEnvMemoryWrapper;
  private ioCollection: {[index: string]: IoItem} = {};


  constructor(os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string) {
    this.os = os;
    this.platform = platform;
    this.machine = machine;
    this.storageWrapper = new StorageEnvMemoryWrapper(envBuilder, envSetDir);
  }


  async prepare() {
    await this.storageWrapper.init();
  }

  /**
   * Collect io items instances.
   * And replace Storage io with wrapper which actually gets configs and manifests from memory.
   */
  async init(): Promise<void> {
    const platformDir: string = resolvePlatformDir(this.platform);
    const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(this.os, platformDir, this.machine);

    for (let ioPath of machineConfig.ios) {
      this.instantiateIo(ioPath, platformDir);
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


  private instantiateIo(ioPath: string, platformDir: string) {
    const ioName: string = getFileNameOfPath(ioPath);
    const ioAbsPath = path.resolve(platformDir, ioPath);
    const IoItemClass: new () => IoItem = this.os.require(ioAbsPath).default;

    // make wrapper of Storage to get configs and manifests from memory
    if (ioName === 'Storage') {
      this.ioCollection[ioName] = this.storageWrapper.makeWrapper(new IoItemClass() as StorageIo);
    }
    else {
      this.ioCollection[ioName] = new IoItemClass();
    }
  }

}
