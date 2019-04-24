import IoSet from '../interfaces/IoSet';
import IoItemDefinition from '../interfaces/IoItemDefinition';
import IoItem, {IoItemClass} from '../interfaces/IoItem';
import System from '../System';


export default class IoSetLocal implements IoSet {
  private ioClasses: {[index: string]: IoItemClass} = {};
  private ioCollection: {[index: string]: IoItem} = {};


  constructor(ioClasses: {[index: string]: IoItemClass}) {
    this.ioClasses = ioClasses;
  }


  async init(system: System): Promise<void> {
    // TODO: for local ioSet загружаем главный файл workDir/io/index.js


    // make dev instances
    for (let ioNme of Object.keys(this.ioClasses)) {
      this.ioCollection[ioNme] = new this.ioClasses[ioNme]();
    }

    delete this.ioClasses;

    // call init methods of instances
    for (let ioNme of Object.keys(this.ioCollection)) {
      const ioItem: IoItem = this.ioCollection[ioNme];

      if (ioItem.init) await ioItem.init();
    }
  }

  async configureAllIo(): Promise<void> {
    // TODO: do it

    const devsParams = await this.system.envSet.loadConfig<IoItemDefinition>(
      this.system.initCfg.fileNames.devsDefinitions
    );

    // configure devs if need
    for (let devNme of Object.keys(devsParams)) {
      const dev: IoItem | undefined = this.devSet[devNme];

      if (!dev) {
        this.system.log.warn(`devsDefinitions config has definition of dev which doesn't exist in list of devs`);

        continue;
      }
      else if (!dev || !dev.configure) {
        continue;
      }

      await dev.configure(devsParams[devNme]);
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
   * Collect io set
   */
  private async collectIoSet(): Promise<{[index: string]: IoItemClass}> {
    //const pathToIoSetIndex = path.join(this.props.workDir, BUILD_IO_DIR, IO_SET_INDEX_FILE);

    return require(pathToIoSetIndex);

    // const devsSet: {[index: string]: new (...params: any[]) => any} = {};
    // const envSetDevsDir = path.join(this.props.workDir, BUILD_IO_DIR);
    // const machineConfig: MachineConfig = loadMachineConfig(this.props.platform, this.props.machine);
    //
    // for (let devPath of machineConfig.devs) {
    //   const devName: string = parseDevName(devPath);
    //   const devFileName: string = `${devName}.js`;
    //   const devAbsPath: string = path.join(envSetDevsDir, devFileName);
    //
    //   devsSet[devName] = require(devAbsPath).default;
    // }
    //
    // return devsSet;
  }

}
