import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import StorageEnvMemoryWrapper from './StorageEnvMemoryWrapper';
import StorageIo from '../../system/interfaces/io/StorageIo';
import {getFileNameOfPath, resolvePlatformDir} from '../../shared/helpers';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';


/**
 * It gets configs and manifests from memory and uses source modules.
 */
export default class IoSetDevelopSrc implements IoSet {
  private readonly os: Os;
  private readonly envBuilder: EnvBuilder;
  private readonly storageWrapper: StorageEnvMemoryWrapper;
  private ioCollection: {[index: string]: IoItem} = {};


  constructor(os: Os, envBuilder: EnvBuilder) {
    this.os = os;
    this.envBuilder = envBuilder;
    this.storageWrapper = new StorageEnvMemoryWrapper(envBuilder);
  }

  async prepare() {
    await this.storageWrapper.init();
  }

  /**
   * Collect io items instances.
   * And replace Storage io with wrapper which actually gets configs and manifests from memory.
   */
  async init(): Promise<void> {
    const platformDir: string = resolvePlatformDir(this.envBuilder.configManager.platform);
    const machineConfig: MachineConfig = this.envBuilder.configManager.machineConfig;

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


  private makeInstance(IoItemClass: new () => IoItem, ioName: string): IoItem {
    // make wrapper of Storage to get configs and manifests from memory
    if (ioName === 'Storage') {
      return this.storageWrapper.makeWrapper(new IoItemClass() as StorageIo);
    }
    else {
      return new IoItemClass();
    }
  }

  private instantiateIo(ioPath: string, platformDir: string) {
    const ioName: string = getFileNameOfPath(ioPath);
    const ioAbsPath = path.resolve(platformDir, ioPath);
    const IoItemClass: new () => IoItem = this.os.require(ioAbsPath).default;

    this.ioCollection[ioName] = this.makeInstance(IoItemClass, ioName);
  }

}
