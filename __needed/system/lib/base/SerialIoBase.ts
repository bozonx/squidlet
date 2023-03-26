import SerialIo, {
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams,
  SerialPortLike
} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/SerialIo.js';
import {ENCODE} from '../../../../../squidlet-lib/src/constants';
import IndexedEventEmitter, {DefaultHandler} from '../../../../../squidlet-lib/src/IndexedEventEmitter';
import IoContext from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoContext.js';
import {SERVER_STARTING_TIMEOUT_SEC} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/constants.js';
import Promised from '../../../../../squidlet-lib/src/Promised';


export type SerialItem = [
  SerialPortLike,
  IndexedEventEmitter<DefaultHandler>
];

export enum ItemPosition {
  serialPort,
  events,
}


export default abstract class SerialIoBase implements SerialIo {
  protected definition?: SerialDefinition;
  protected instances: Record<string, SerialItem> = {};
  protected abstract createConnection(portNum: number | string, params: SerialParams): Promise<SerialPortLike>;


  async init(ioContext: IoContext): Promise<void> {
    if (!this.definition) {
      throw new Error(`No serial port definitions`);
    }

    const promises: Promise<void>[] = [];

    for (let portNum in this.definition.ports) {
      promises.push(
        this.makePortItem(portNum, this.definition.ports[portNum])
          .then((item: SerialItem) => {
            this.instances[portNum] = item;
          })
      );
    }

    return Promise.all(promises).then();
  }

  async configure(definition: SerialDefinition) {
    this.definition = definition;
  }

  async destroy() {
    for (let portNum in this.instances) {
      if (!this.instances.hasOwnProperty(portNum)) continue;

      await this.destroyPort(portNum);
    }

    delete this.instances;
  }

  destroyPort(portNum: number | string): Promise<void> {
    const promise: Promise<void> = this.instances[portNum][ItemPosition.serialPort].close();

    this.instances[portNum][ItemPosition.events].destroy();

    delete this.instances[portNum];

    return promise;
  }

  async onData(portNum: number | string, handler: (data: string | Uint8Array) => void): Promise<number> {
    return this.getItem(portNum)[ItemPosition.events].addListener(SerialEvents.data, handler);
  }

  async onError(portNum: number | string, handler: (err: string) => void): Promise<number> {
    return this.getItem(portNum)[ItemPosition.events].addListener(SerialEvents.error, handler);
  }

  async removeListener(portNum: number | string, handlerIndex: number): Promise<void> {
    this.getItem(portNum)[ItemPosition.events].removeListener(handlerIndex);
  }

  async write(portNum: number | string, data: Uint8Array): Promise<void> {
    await this.getItem(portNum)[ItemPosition.serialPort].write(data);
  }

  async print(portNum: number | string, data: string): Promise<void> {
    await this.getItem(portNum)[ItemPosition.serialPort].write(data, ENCODE);
  }

  async println(portNum: number | string, data: string): Promise<void> {
    await this.getItem(portNum)[ItemPosition.serialPort].write(`${data}\n`, ENCODE);
  }


  protected async makePortItem(portNum: string, params: SerialParams): Promise<SerialItem> {
    const combinedParams: SerialParams = {
      ...defaultSerialParams,
      ...params,
    };
    const serialPort: SerialPortLike = await this.createConnection(portNum, combinedParams);
    const events = new IndexedEventEmitter<DefaultHandler>();

    await this.tryToConnect(serialPort);

    serialPort.on('data', (data: Uint8Array | string) =>
      this.getItem(portNum)[ItemPosition.events].emit(SerialEvents.data, data));
    serialPort.on('error', (err: string) => events.emit(SerialEvents.error, err));

    return [
      serialPort,
      events
    ];
  }

  protected getItem(portNum: number | string): SerialItem {
    if (!this.instances[portNum]) {
      throw new Error(`Serial IO: port "${portNum}" hasn't been instantiated`);
    }

    return this.instances[portNum];
  }


  private tryToConnect(serialPort: SerialPortLike): Promise<void> {
    const connectionPromised: Promised = new Promised<void>();
    let openTimeout: any;
    let errorHandler: any;
    let openHandler: any;

    errorHandler = (err: string) => {
      clearTimeout(openTimeout);
      serialPort.off('error', errorHandler);
      serialPort.off('open', openHandler);
      connectionPromised.reject(new Error(err));
    };
    openHandler = () => {
      clearTimeout(openTimeout);
      serialPort.off('error', errorHandler);
      serialPort.off('open', openHandler);
      connectionPromised.resolve();
    };
    openTimeout = setTimeout(() => {
      serialPort.off('error', errorHandler);
      serialPort.off('open', openHandler);
      connectionPromised.reject(new Error(`Serial IO: timeout of opening a serial port has been exceeded`));
    }, SERVER_STARTING_TIMEOUT_SEC * 1000);

    serialPort.on('error', errorHandler);
    serialPort.on('open', openHandler);

    return connectionPromised.promise;
  }

}
