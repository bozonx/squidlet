type Timeout = NodeJS.Timeout;
import NetworkDriver, {
  IncomeRequestHandler,
  IncomeResponseHandler,
  NetworkDriverProps,
  NetworkRequest,
  NetworkResponse,
  NetworkStatus,
} from 'system/interfaces/NetworkDriver';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import { hexNumToString, stringToUint8Array } from 'system/lib/binaryHelpers';
import Promised from 'system/lib/Promised';
import {makeUniqNumber} from 'system/lib/uniqId';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {
  COMMANDS, deserializeRequest,
  deserializeResponse,
  MESSAGE_POSITION,
  REQUEST_PAYLOAD_START,
  serializeRequest,
  serializeResponse
} from 'system/lib/networkHelpers';
import {Serial} from '../Serial/Serial';


export interface SerialNetworkProps extends NetworkDriverProps {
}

enum EVENTS {
  request,
  response,
}


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
    // TODO: make 16 bit number
    const requestId: number = makeUniqNumber();
    const request: NetworkRequest = { requestId, body };
    let timeout: Timeout | undefined;

    this.sendRequest(register, request)
      .catch((e: Error) => {
        clearTimeout(timeout as any);
        !promised.isFulfilled() && promised.reject(e);
      });

    // listen for response
    const listenIndex = this.onIncomeResponse(register, (response: NetworkResponse) => {
      // do nothing if filed or resolved. process only ours request
      if (promised.isFulfilled() || response.requestId !== requestId) return;

      this.removeListener(listenIndex);
      clearTimeout(timeout as any);

      promised.resolve(response);
    });

    timeout = setTimeout(() => {
      if (promised.isFulfilled()) return;

      this.removeListener(listenIndex);

      promised.reject(
        new Error(`SerialNetwork.request: Timeout of request has been exceeded of register "${register}"`)
      );
      // TODO: может лучше взять из основного конфига
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
            status: NetworkStatus.errorMessage,
            body: new Uint8Array(stringToUint8Array(String(e))),
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
    const data: Uint8Array = serializeRequest(register, request);

    // TODO: может use sendoer для переотправки запроса
    // TODO: либо может sender сделать в нижнем драйвере
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    return this.serial.write(data);
  }

  private sendResponse(register: number, response: NetworkResponse): Promise<void> {
    const data: Uint8Array = serializeResponse(register, response);

    // TODO: может use sendoer для переотправки запроса
    // TODO: либо может sender сделать в нижнем драйвере
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    return this.serial.write(data);
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

    const register: number = data[MESSAGE_POSITION.register];

    if (data[MESSAGE_POSITION.command] === COMMANDS.request) {
      const request: NetworkRequest = deserializeRequest(data);
      const eventName: string = `${EVENTS.request}${hexNumToString(register)}`;

      this.events.emit(eventName, request);
    }
    else {
      // response
      const response: NetworkResponse = deserializeResponse(data);
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
