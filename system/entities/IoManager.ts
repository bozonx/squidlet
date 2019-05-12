import IoSet from '../interfaces/IoSet';
import IoItem from '../interfaces/IoItem';
import System from '../System';
import IoItemDefinition from '../interfaces/IoItemDefinition';
import IoSetLocal from './IoSetLocal';


export default class IoManager {
  private readonly system: System;
  private readonly ioSet: IoSet;


  constructor(system: System, ioSet?: IoSet) {
    this.system = system;
    this.ioSet = this.resolveIoSet(ioSet);
  }

  async init(): Promise<void> {
    await this.ioSet.init(this.system);
    await this.initAllIo();
    await this.configureAllIo();
  }

  async destroy() {
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

    await this.ioSet.destroy();
  }


  getIo<T extends IoItem>(ioName: string): T {
    return this.ioSet.getIo<T>(ioName);
  }


  private async initAllIo() {
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.init) await ioItem.init();
    }
  }

  private async configureAllIo() {
    const ioNames: string[] = this.ioSet.getNames();
    const ioParams = await this.system.envSet.loadConfig<IoItemDefinition>(
      this.system.initCfg.fileNames.iosDefinitions
    );

    // configure ios if need
    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (!ioItem) {
        this.system.log.warn(`ioDefinitions config has definition of io item which doesn't exist in ioSet`);

        continue;
      }
      else if (!ioParams[ioName] || !ioItem || !ioItem.configure) {
        continue;
      }

      await ioItem.configure(ioParams[ioName]);
    }
  }

  private resolveIoSet(specifiedIoSet?: IoSet): IoSet {
    // use specified IO set if it is set
    if (specifiedIoSet) return specifiedIoSet;

    // use local IO set by default
    return new IoSetLocal();
  }

}
