import NetworkDriver, {
  IncomeRequestHandler,
  IncomeResponseHandler,
  NetworkDriverProps,
  NetworkRequest,
  NetworkResponse,
} from 'system/interfaces/NetworkDriver';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {addFirstItemUint8Arr, withoutFirstItemUint8Arr} from 'system/lib/binaryHelpers';
import {FUNCTION_NUMBER_LENGTH} from 'system/lib/constants';
import {hexStringToHexNum} from 'system/lib/binaryHelpers';
import Promised from 'system/lib/Promised';
import {makeUniqNumber} from 'system/lib/uniqId';
import {Serial} from '../Serial/Serial';


export interface SerialNetworkProps extends NetworkDriverProps {
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


  async request(register: number, body: Uint8Array): Promise<NetworkRequest> {
    const promised = new Promised();
    const requestId: number = makeUniqNumber();
    const request: NetworkRequest = {
      requestId,
      body,
    };

    this.sendRequest(register, request)
      .catch((e: Error) => {
        if (promised.isFulfilled()) return;

        promised.reject(e);
      });

    // listen for response
    const listenIndex = this.onResponse(register, (response: NetworkResponse) => {
      // do nothing if filed or resolved
      if (promised.isFulfilled()) return;
      // process only ours request
      else if (response.requestId !== requestId) return;

      this.removeListener(listenIndex);

      promised.resolve(response);
    });

    setTimeout(() => {
      if (promised.isFulfilled()) return;

      this.removeListener(listenIndex);

      promised.reject(
        new Error(`SerialNetwork.request: Timeout of request has been exceeded of register "${register}"`)
      );
    }, this.props.requestTimeoutSec * 1000);

    return promised.promise;
  }

  onRequest(register: number, handler: IncomeRequestHandler): number {
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

  onResponse(register: number, handler: IncomeResponseHandler): number {
    // TODO: add !!!!
  }

  removeListener(handlerIndex: number): void {
    // TODO: add !!!!
    //this.serialDev.removeListener(handlerIndex);
  }


  // TODO: review
  private sendRequest(register: number, request: NetworkRequest): Promise<void> {
    // TODO: может use sendoer для переотправки запроса
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

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
