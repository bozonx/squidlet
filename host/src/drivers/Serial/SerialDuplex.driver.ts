import DuplexDriver, {ReceiveHandler} from '../../app/interfaces/DuplexDriver';
import DriverBase from '../../app/entities/DriverBase';
import Serial from '../../app/interfaces/dev/Serial';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {addFirstItemUint8Arr, withoutFirstItemUint8Arr} from '../../helpers/helpers';
import {DATA_ADDRESS_LENGTH} from '../../app/dict/constants';
import {hexStringToHexNum} from '../../helpers/binaryHelpers';


export interface SerialNodeProps {
  uartNum: number;
  // wait for data transfer ends on send and request methods
  requestTimeout: number;
}


export class SerialDuplexDriver extends DriverBase<SerialNodeProps> implements DuplexDriver {
  private get serialDev(): Serial {
    return this.depsInstances.serialDev as Serial;
  }

  protected willInit = async () => {
    this.depsInstances.serialDev = this.env.getDev('Serial');
  }


  // TODO: add queue - запретить посылать данные (или посылать другие requests) пока ждем ответ или добавить свой маркер


  async send(dataAddressStr: number | string, data?: Uint8Array): Promise<void> {

    // TODO: таймаут соединения - use sendoer

    await this.sendData(dataAddressStr, data);
  }

  async request(dataAddressStr: number | string, data?: Uint8Array): Promise<Uint8Array> {

    // TODO: review

    if (typeof dataAddressStr === 'undefined') {
      throw new Error(`SerialDuplexDriver.request: You have to specify a "dataAddress" param`);
    }

    return new Promise<Uint8Array>(async (resolve, reject) => {
      let failed = false;
      let fulfilled = false;

      // TODO: тоже ждать таймаут - лучше наверное тогда вызвать this.send()
      this.sendData(dataAddressStr, data)
        .catch((err) => {
          failed = true;
          reject(err);
        });

      // listen for response
      const listenIndex = this.onReceive((receivedDataAddressStr: number | string, data: Uint8Array) => {
        // do nothing if filed
        if (failed) return;

        fulfilled = true;

        if (receivedDataAddressStr !== dataAddressStr) return;

        resolve(data);
      });

      setTimeout(() => {
        if (failed) return;

        if (!fulfilled) {
          failed = true;
          reject(`SerialDuplexDriver.request: Timeout of request has been reached of dataAddress "${dataAddressStr}"`);
        }

      }, this.props.requestTimeout);
    });
  }

  onReceive(cb: ReceiveHandler): number {
    const wrapper = (data: Uint8Array) => {
      if (!data.length) {
        return this.env.system.log.error(`SerialDuplexDriver: Received event without a dataAddress`);
      }

      const dataAddress = data[0];
      const onlyData: Uint8Array = withoutFirstItemUint8Arr(data);

      cb(dataAddress, onlyData);
    };

    return this.serialDev.on(this.props.uartNum, 'data', wrapper);
  }

  removeListener(handlerIndex: number): void {
    this.serialDev.removeListener(handlerIndex);
  }


  private sendData(dataAddressStr: number | string, data?: Uint8Array): Promise<void> {
    if (typeof dataAddressStr === 'undefined') {
      throw new Error(`SerialDuplexDriver.send: You have to specify a "dataAddress" param`);
    }

    let dataToWrite: Uint8Array;
    const dataAddrHex: number = hexStringToHexNum(dataAddressStr);

    if (typeof data === 'undefined') {
      dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
      dataToWrite[0] = dataAddrHex;
    }
    else {
      dataToWrite = addFirstItemUint8Arr(data, dataAddrHex);
    }

    return this.serialDev.write(this.props.uartNum, dataToWrite);
  }

}


export default class Factory extends DriverFactoryBase<SerialDuplexDriver> {
  protected DriverClass = SerialDuplexDriver;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.uartNum);
  }
}
