import IoSet from '../interfaces/IoSet';
import IoItemDefinition from '../interfaces/IoItemDefinition';
import IoItem, {IoItemClass} from '../interfaces/IoItem';
import System from '../System';
import {pathJoin} from '../helpers/nodeLike';


export default class IoSetLocal implements IoSet {
  protected _system?: System;
  protected ioCollection: {[index: string]: IoItem} = {};
  protected get system(): System {
    return this._system as any;
  }


  async init(system: System): Promise<void> {
    this._system = system;

    const ioClasses: {[index: string]: IoItemClass} = await this.loadIoCollection();

    // make dev instances
    for (let ioName of Object.keys(ioClasses)) {
      this.ioCollection[ioName] = new ioClasses[ioName]();
    }

    await this.initAllIo();
  }

  async configureAllIo(): Promise<void> {
    const ioParams = await this.system.envSet.loadConfig<IoItemDefinition>(
      this.system.initCfg.fileNames.devsDefinitions
    );

    // configure devs if need
    for (let ioName of Object.keys(ioParams)) {
      const ioItem: IoItem | undefined = this.ioCollection[ioName];

      if (!ioItem) {
        this.system.log.warn(`ioDefinitions config has definition of io item which doesn't exist in collection of io`);

        continue;
      }
      else if (!ioItem || !ioItem.configure) {
        continue;
      }

      await ioItem.configure(ioParams[ioName]);
    }
  }

  getInstance<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

  destroy(): void {
    delete this.ioCollection;
  }

  /**
   * call init method of instances
   */
  protected async initAllIo() {
    for (let ioName of Object.keys(this.ioCollection)) {
      const ioItem: IoItem = this.ioCollection[ioName];

      if (ioItem.init) await ioItem.init();
    }
  }

  /**
   * Load io collection workDir/io/index.js
   */
  private async loadIoCollection(): Promise<{[index: string]: IoItemClass}> {
    const pathToIoSetIndex = pathJoin(
      this.system.systemConfig.rootDirs.envSet,
      this.system.systemConfig.envSetDirs.devs,
    );

    return require(pathToIoSetIndex);
  }

}
