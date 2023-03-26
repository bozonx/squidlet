import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import {loadMachineConfigInPlatformDir, getFileNameOfPath, resolvePlatformDir} from '../../shared/helpers';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';


/**
 * It uses source io files.
 */
export default class IoSetSrc implements IoSet {
  private readonly os: Os;
  private readonly platform: Platforms;
  private readonly machine: string;
  private ioCollection: {[index: string]: IoItem} = {};


  constructor(os: Os, platform: Platforms, machine: string) {
    this.os = os;
    this.platform = platform;
    this.machine = machine;
  }

  async prepare() {
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

    this.ioCollection[ioName] = this.makeInstance(IoItemClass, ioName);
  }

  protected makeInstance(IoItemClass: new () => IoItem, ioName: string): IoItem {
    return  new IoItemClass();
  }

}
