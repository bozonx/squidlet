import NetworkDriver, {
  IncomeRequestHandler,
  NetworkDriverProps,
  NetworkRequest,
  ReceiveHandler
} from 'system/interfaces/NetworkDriver';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {addFirstItemUint8Arr, withoutFirstItemUint8Arr} from 'system/lib/binaryHelpers';
import {FUNCTION_NUMBER_LENGTH} from 'system/lib/constants';
import {hexStringToHexNum} from 'system/lib/binaryHelpers';
import {Serial} from '../Serial/Serial';


export interface SerialNetworkProps extends NetworkDriverProps {
  // wait for data transfer ends on send and request methods
  //requestTimeout: number;
}


export class SerialNetwork extends DriverBase<SerialNetworkProps> implements NetworkDriver {
  private get serial(): Serial {
    return this.depsInstances.serial as any;
  }

  init = async () => {
    this.depsInstances.serial = this.context.getSubDriver('Serial', {
      portNum: this.props.busId,
    });

    this.serial.onMessage(this.handleIncomeMessage);
  }


  async request(register: number, data?: Uint8Array): Promise<NetworkRequest> {
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди
    // TODO: таймаут соединения - use sendoer
    // TODO: review

    return new Promise<NetworkRequest>(async (resolve, reject) => {
      let failed = false;
      // failed or resolved
      let fulfilled = false;

      // TODO: игнорировать если будет таймаут
      this.sendRequest(register, data)
        .catch((e) => {

          failed = true;
          reject(e);
        });

      // listen for response
      const listenIndex = this.onIncome(register, (request: NetworkRequest) => {
        // do nothing if filed
        if (failed) return;

        fulfilled = true;

        if (receivedDataAddressStr !== dataAddressStr) return;

        resolve(data);

        // TODO: remove listenIndex
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

  onIncome(register: number, handler: IncomeRequestHandler): number {
    const wrapper = (data: Uint8Array) => {
      if (!data.length) {
        return this.env.log.error(`SerialDuplexDriver: Received event without a dataAddress`);
      }

      const dataAddress = data[0];
      const onlyData: Uint8Array = withoutFirstItemUint8Arr(data);

      cb(dataAddress, onlyData);
    };

    return this.serialDev.on(this.props.uartNum, 'data', wrapper);
  }

  removeListener(handlerIndex: number): void {
    // TODO: add !!!!
    //this.serialDev.removeListener(handlerIndex);
  }


  // TODO: review
  private sendRequest(dataAddressStr: number | string, data?: Uint8Array): Promise<void> {
    if (typeof dataAddressStr === 'undefined') {
      throw new Error(`SerialDuplexDriver.send: You have to specify a "dataAddress" param`);
    }

    let dataToWrite: Uint8Array;
    const dataAddrHex: number = hexStringToHexNum(dataAddressStr);

    if (typeof data === 'undefined') {
      dataToWrite = new Uint8Array(FUNCTION_NUMBER_LENGTH);
      dataToWrite[0] = dataAddrHex;
    }
    else {
      dataToWrite = addFirstItemUint8Arr(data, dataAddrHex);
    }

    return this.serialDev.write(this.props.uartNum, dataToWrite);
  }

  private handleIncomeMessage(data: string | Uint8Array) {

  }

}


export default class Factory extends DriverFactoryBase<SerialNetwork, SerialDuplexProps> {
  protected SubDriverClass = SerialNetwork;

  protected instanceId = (props: SerialDuplexProps): string => {
    return String(props.uartNum);
  }
}
