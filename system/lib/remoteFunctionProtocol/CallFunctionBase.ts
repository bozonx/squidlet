import {makeCallFunctionMessage} from './writeLogic';
import {clearArray} from '../arrays';


export default abstract class CallFunctionBase {
  private callBuffer: [number, Uint8Array][] = [];


  constructor() {
  }


  protected abstract writePackage(packageData: Uint8Array): Promise<void>;


  callFunction(funcNum: number, rawArgs: Uint8Array): Promise<void> {
    this.callBuffer.push([funcNum, rawArgs]);

    return new Promise<void>((resolve, reject) => {
      // TODO: если уже отправляются ?????
      //       то закидывать в буфер но колбэк выполнить только
      //       после завершения отправки текущего
      // do write at the next tick
      setTimeout(() => {
        this.sendPackages()
          .then(resolve)
          .catch(reject);
      }, 0);
    });
  }


  private async sendPackages(): Promise<void> {
    const packages: Uint8Array[] = [];

    for (let item of this.callBuffer) {
      packages.push(makeCallFunctionMessage(item[0], item[1]));
    }

    clearArray(this.callBuffer);

    for (let item of packages) {
      await this.writePackage(item);
    }
  }

}
