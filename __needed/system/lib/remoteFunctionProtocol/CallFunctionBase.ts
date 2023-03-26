import {makeCallFunctionMessage} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/remoteFunctionProtocol/writeLogic.js';
import {clearArray} from '../../../../../squidlet-lib/src/arrays';


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
    // TODO: вынести код формирования пакетов в хэлперы
    const packages: Uint8Array[] = [];

    for (let item of this.callBuffer) {

      // TODO: запихивать в 1 пакет несколько сообщений с указанием длины
      // TODO: если длина слишком большая то делать новый пакет

      packages.push(makeCallFunctionMessage(item[0], item[1]));
    }

    clearArray(this.callBuffer);

    for (let item of packages) {
      await this.writePackage(item);
    }
  }

}
