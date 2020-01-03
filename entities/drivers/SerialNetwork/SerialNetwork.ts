import NetworkDriver, {
  IncomeRequestHandler,
  IncomeResponseHandler,
  NetworkDriverProps,
  NetworkRequest,
  NetworkResponse,
} from 'system/interfaces/NetworkDriver';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {
  addFirstItemUint8Arr, concatUint8Arr,
  hexNumToString,
  numToUint8Word,
  uint8ToNum,
  withoutFirstItemUint8Arr
} from 'system/lib/binaryHelpers';
import {FUNCTION_NUMBER_LENGTH} from 'system/lib/constants';
import {hexStringToHexNum} from 'system/lib/binaryHelpers';
import Promised from 'system/lib/Promised';
import {makeUniqNumber} from 'system/lib/uniqId';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {Serial} from '../Serial/Serial';


export interface SerialNetworkProps extends NetworkDriverProps {
}

enum EVENTS {
  request,
  response,
}

enum COMMANDS {
  request = 254,
  response,
}

enum MESSAGE_POSITION {
  command,
  register,
  requestIdStart,
  requestIdEnd,
  responseStatusStart,
  responseStatusEnd,
}

const REQUEST_PAYLOAD_START = 4;
const RESPONSE_PAYLOAD_START = 6;


export class SerialNetwork extends DriverBase<SerialNetworkProps> implements NetworkDriver {
  private events = new IndexedEventEmitter();

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
    const listenIndex = this.onIncomeResponse(register, (response: NetworkResponse) => {
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

    //return this.serialDev.on(this.props.uartNum, 'data', wrapper);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  private onIncomeResponse(register: number, handler: IncomeResponseHandler): number {
    const eventName: string = `${EVENTS.response}${hexNumToString(register)}`;

    return this.events.addListener(eventName, handler);
  }

  // TODO: review
  private sendRequest(register: number, request: NetworkRequest): Promise<void> {
    // TODO: test by hard
    // TODO: может use sendoer для переотправки запроса
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    const dataToWrite: Uint8Array = new Uint8Array(REQUEST_PAYLOAD_START + request.body.length);
    const requestIdUint: Uint8Array = numToUint8Word(request.requestId);

    dataToWrite[MESSAGE_POSITION.command] = COMMANDS.request;
    dataToWrite[MESSAGE_POSITION.register] = register;
    dataToWrite[MESSAGE_POSITION.requestIdStart] = requestIdUint[0];
    dataToWrite[MESSAGE_POSITION.requestIdEnd] = requestIdUint[1];

    // for (let i = 0; i < request.body.length; i++) {
    //   dataToWrite[REQUEST_PAYLOAD_START + 0] = request.body[i];
    // }

    const dataToWrite: Uint8Array = concatUint8Arr(metaData, request.body);

    //const dataAddrHex: number = hexStringToHexNum(dataAddressStr);

    if (typeof data === 'undefined') {
      dataToWrite = new Uint8Array(FUNCTION_NUMBER_LENGTH);
      dataToWrite[0] = dataAddrHex;
    }
    else {
      dataToWrite = addFirstItemUint8Arr(data, dataAddrHex);
    }

    return this.serialDev.write(this.props.uartNum, dataToWrite);
  }

  /**
   * Handle income message and deserialize it.
   * @param data
   */
  private handleIncomeMessage(data: string | Uint8Array) {
    if (!(data instanceof Uint8Array)) {
      return this.log.error(`SerialNetwork: income data has to be Uint8Array`);
    }
    else if (data.length < REQUEST_PAYLOAD_START) {
      return this.log.error(`SerialNetwork: incorrect data length: ${data.length}`);
    }
    else if (
      data[MESSAGE_POSITION.command] !== COMMANDS.request
      && data[MESSAGE_POSITION.command] !== COMMANDS.response
    ) {
      // skip not ours commands
      return;
    }

    // TODO: test by hard

    const register: number = data[MESSAGE_POSITION.register];
    // requestId is 16 bit int
    const requestId: number = uint8ToNum(
      data.slice(MESSAGE_POSITION.requestIdStart, MESSAGE_POSITION.requestIdEnd + 1)
    );

    if (data[MESSAGE_POSITION.command] === COMMANDS.request) {
      const body: Uint8Array = data.slice(REQUEST_PAYLOAD_START);
      const request: NetworkRequest = {
        requestId,
        body,
      };
      const eventName: string = `${EVENTS.request}${hexNumToString(register)}`;

      this.events.emit(eventName, request);
    }
    else {
      // response
      // status is 16 bit int
      const status: number = uint8ToNum(
        data.slice(MESSAGE_POSITION.responseStatusStart, MESSAGE_POSITION.responseStatusEnd + 1)
      );
      const body: Uint8Array = data.slice(RESPONSE_PAYLOAD_START);
      const response: NetworkResponse = {
        requestId,
        status,
        body,
      };
      const eventName: string = `${EVENTS.response}${hexNumToString(register)}`;

      this.events.emit(eventName, response);
    }
  }

  // TODO: сделать бесконечный requestId но толко с 65535 значений

}


export default class Factory extends DriverFactoryBase<SerialNetwork, SerialNetworkProps> {
  protected SubDriverClass = SerialNetwork;
  protected instanceId = (props: SerialNetworkProps): string => String(props.busId);
}
