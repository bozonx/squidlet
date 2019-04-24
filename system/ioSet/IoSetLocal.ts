import IoSet from '../interfaces/IoSet';
import * as path from "path";
import DevsDefinitions from '../interfaces/DevsDefinitions';
import IoItem from '../interfaces/IoItem';


export default class IoSetLocal implements IoSet {
  constructor() {

    // // make dev instances
    // for (let devNme of Object.keys(devSet)) {
    //   this.devSet[devNme] = new devSet[devNme]();
    // }

    // // call initializing of instances
    // for (let devNme of Object.keys(this.devSet)) {
    //   const dev: IoItem = this.devSet[devNme];
    //
    //   if (dev.init) await dev.init();
    // }
    //
    // return this.configureDevs();
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


  private async configureDevs() {
    const devsParams = await this.system.envSet.loadConfig<DevsDefinitions>(
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

}
