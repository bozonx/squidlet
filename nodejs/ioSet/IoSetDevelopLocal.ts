import IoSet from '../../system/interfaces/IoSet';
import * as path from "path";
import {HOST_ENVSET_DIR} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import IoSetLocal from '../../system/entities/IoSetLocal';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';


export default class IoSetDevelopLocal extends IoSetLocal implements IoSet {
  async prepare() {

  }

  getIo<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

  /**
   * Read machine config and load io which are specified there.
   */
  private async makeDevelopIoCollection(
    os: Os,
    platformDir: string,
    machine: string
  ): Promise<{[index: string]: IoItemClass}> {
    const ioSet: {[index: string]: new (...params: any[]) => any} = {};
    const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(platformDir, machine);
    const evalModulePath: string = path.join(platformDir, machine, 'evalModule');
    const machineEvalModule: any = require(evalModulePath);

    for (let ioPath of machineConfig.ios) {
      const ioName: string = parseIoName(ioPath);
      const ioAbsPath = path.resolve(platformDir, ioPath);
      const moduleContent: string = await os.getFileContent(ioAbsPath);
      const compiledModuleContent: string = ts.transpile(moduleContent);

      ioSet[ioName] = machineEvalModule(compiledModuleContent);
    }

    return ioSet;
  }

}
