import IoSet from '../interfaces/IoSet';
import {DevClass} from '../entities/ioManager';
import * as path from "path";


export default class IoSetLocal implements IoSet {
  constructor() {

  }


  /**
   * Collect io set
   */
  private async collectIoSet(): Promise<{[index: string]: DevClass}> {
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
