import * as SerialPort from 'serialport';
import {OpenOptions} from 'serialport';

import SerialIo, {
  defaultSerialParams,
  SerialDefinition,
  SerialEvents,
  SerialParams
} from 'system/interfaces/io/SerialIo';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {AnyHandler} from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';
import {callPromised} from 'system/lib/common';
import {ENCODE, SERVER_STARTING_TIMEOUT_SEC} from 'system/constants';
import SerialIoBase, {SerialItem} from '../../system/base/SerialIoBase';



export default class Serial extends SerialIoBase<SerialPort> implements SerialIo {
  protected async makePortItem(portNum: number, paramsOverride: SerialParams): Promise<SerialItem<SerialPort>> {
    const params: SerialParams = {
      ...defaultSerialParams,
      ...this.getPreDefinedPortParams()[portNum],
      ...paramsOverride,
    };

    if (!params.dev) {
      throw new Error(
        `Params of serial port ${portNum} has to have a "dev" parameter ` +
        `which points to serial device`
      );
    }

    const options: OpenOptions = omitObj(params, 'dev', 'rxPin', 'txPin');
    const serialPort: SerialPort = await this.createConnection(params.dev, options);
    const events = new IndexedEventEmitter<AnyHandler>();

    serialPort.on('data', (data: string | Buffer) => this.handleIncomeData(portNum, data));
    serialPort.on('error', (err) => events.emit(SerialEvents.error, err.message));

    return [
      serialPort,
      events
    ];
  }

  private async createConnection(dev: string, options: OpenOptions): Promise<SerialPort> {
    return new Promise<SerialPort>((resolve, reject) => {
      const serialPort: SerialPort = new SerialPort(dev, options);

      let openTimeout: any;
      let errorHandler: any;
      let openHandler: any;

      errorHandler = (err: {message: string}) => {
        clearTimeout(openTimeout);
        serialPort.off('error', errorHandler);
        serialPort.off('open', openHandler);
        reject(err.message);
      };
      openHandler = () => {
        clearTimeout(openTimeout);
        serialPort.off('error', errorHandler);
        serialPort.off('open', openHandler);
        resolve(serialPort);
      };

      serialPort.on('error', errorHandler);
      serialPort.on('open', openHandler);

      openTimeout = setTimeout(() => {
        serialPort.off('error', errorHandler);
        serialPort.off('open', openHandler);
        reject(`Serial IO: timeout of opening a serial port has been exceeded`);
      }, SERVER_STARTING_TIMEOUT_SEC * 1000);
    });
  }

  protected parseIncomeData(data: string | Buffer | null): string | Uint8Array {
    if (!data) {
      return '';
    }
    else if (typeof data === 'string') {
      //return textToUint8Array(data);

      return data;
    }
    else if (Buffer.isBuffer(data)) {
      return convertBufferToUint8Array(data as Buffer);
    }

    throw new Error(`Unknown type of returned value "${JSON.stringify(data)}"`);
  }

}
