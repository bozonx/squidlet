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
  concatUint8Arr,
  hexNumToString,
  numToUint8Word,
  uint8ToNum,
} from 'system/lib/binaryHelpers';
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
    const wrapper = (request: NetworkRequest) => {
      handler(request)
        .then((response: NetworkResponse) => {
          // send response and don't wait for result
          this.sendResponse(register, response)
            .catch(this.log.error);
        })
        .catch((e) => {
          const response: NetworkResponse = {
            requestId: request.requestId,
            status: 500,
            // TODO: как отправить ошибку ???? может сделать отдельную комманду ????
            body: new Uint8Array(0),
          };

          this.sendResponse(register, response)
            .catch(this.log.error);
        });
    };

    const eventName: string = `${EVENTS.request}${hexNumToString(register)}`;

    return this.events.addListener(eventName, wrapper);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  private onIncomeResponse(register: number, handler: IncomeResponseHandler): number {
    const eventName: string = `${EVENTS.response}${hexNumToString(register)}`;

    return this.events.addListener(eventName, handler);
  }

  private sendRequest(register: number, request: NetworkRequest): Promise<void> {
    // TODO: test by hard
    // TODO: move to helper

    const requestIdUint: Uint8Array = numToUint8Word(request.requestId);
    const metaData: Uint8Array = new Uint8Array([
      COMMANDS.request,
      register,
      requestIdUint[0],
      requestIdUint[1]
    ]);
    const dataToWrite: Uint8Array = concatUint8Arr(metaData, request.body);

    // TODO: может use sendoer для переотправки запроса
    // TODO: либо может sender сделать в нижнем драйвере
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    return this.serial.write(dataToWrite);
  }

  private sendResponse(register: number, response: NetworkResponse): Promise<void> {
    // TODO: test by hard
    // TODO: move to helper

    const requestIdUint: Uint8Array = numToUint8Word(response.requestId);
    const statusUint: Uint8Array = numToUint8Word(response.status);
    const metaData: Uint8Array = new Uint8Array([
      COMMANDS.request,
      register,
      requestIdUint[0],
      requestIdUint[1],
      statusUint[0],
      statusUint[1],
    ]);
    const dataToWrite: Uint8Array = concatUint8Arr(metaData, response.body);

    // TODO: может use sendoer для переотправки запроса
    // TODO: либо может sender сделать в нижнем драйвере
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    return this.serial.write(dataToWrite);
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

    // TODO: move to helper
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
