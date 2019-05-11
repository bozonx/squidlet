import IoSet from '../interfaces/IoSet';
import IoItem from '../interfaces/IoItem';
import System from '../System';
import IoItemDefinition from '../interfaces/IoItemDefinition';


export default class IoManager {
  private readonly system: System;
  private readonly ioSet: IoSet;


  constructor(system: System, ioSet: IoSet) {
    this.system = system;
    this.ioSet = ioSet;
  }

  async init(): Promise<void> {
    await this.ioSet.init(this.system);

    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.init) await ioItem.init();
    }
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

  async configureAllIo(): Promise<void> {
    const ioNames: string[] = this.ioSet.getNames();
    const ioParams = await this.system.envSet.loadConfig<IoItemDefinition>(
      this.system.initCfg.fileNames.devsDefinitions
    );

    // configure devs if need
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

}
