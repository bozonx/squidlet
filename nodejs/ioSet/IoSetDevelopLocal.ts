import * as path from 'path';
import * as ts from 'typescript';

import IoSet from '../../system/interfaces/IoSet';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import System from '../../system';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import {loadMachineConfigInPlatformDir, getFileNameOfPath, resolvePlatformDir} from '../../shared/helpers';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import StorageEnvMemoryWrapper from './StorageEnvMemoryWrapper';
import StorageIo from '../../system/interfaces/io/StorageIo';


export default class IoSetDevelopLocal implements IoSet {
  private readonly os: Os;
  private readonly platform: Platforms;
  private readonly machine: string;
  private storageWrapper: StorageEnvMemoryWrapper;
  protected ioCollection: {[index: string]: IoItem} = {};


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
   * Collect io items instances
   */
  async init(system: System): Promise<void> {
    const platformDir: string = resolvePlatformDir(this.platform);
    const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(platformDir, this.machine);
    const evalModulePath: string = path.join(platformDir, this.machine, 'evalModule');
    const machineEvalModule: any = require(evalModulePath);

    for (let ioPath of machineConfig.ios) {
      const ioName: string = getFileNameOfPath(ioPath);
      const ioAbsPath = path.resolve(platformDir, ioPath);

      // TODO: review

      const moduleContent: string = await this.os.getFileContent(ioAbsPath);
      const compiledModuleContent: string = ts.transpile(moduleContent);
      const ioItemClass: new () => IoItem = machineEvalModule(compiledModuleContent);

      if (ioName === 'Storage') {
        this.ioCollection[ioName] = this.storageWrapper.makeWrapper(new ioItemClass() as StorageIo);
      }
      else {
        this.ioCollection[ioName] = new ioItemClass();
      }
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

}
