import * as SerialPort from 'serialport';
import {OpenOptions} from 'serialport';

import SerialIo, {SerialParams, SerialPortLike} from 'system/interfaces/io/SerialIo';
import {omitObj} from 'system/lib/objects';
import SerialIoBase from 'system/lib/base/SerialIoBase';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import {callPromised} from 'system/lib/common';


export default class Serial extends SerialIoBase implements SerialIo {
  protected async createConnection(portNum: number | string, params: SerialParams): Promise<SerialPortLike> {
    if (!params.dev) {
      throw new Error(
        `Params of serial port ${portNum} has to have a "dev" parameter ` +
        `which points to serial device`
      );
    }

    // pick options. baudRate has the same name
    const options: OpenOptions = omitObj(params, 'dev', 'pinRX', 'pinTX');
    const serialPort: SerialPort = new SerialPort(params.dev, options);

    return {
      write(data: any, encode?: string): Promise<void> {
        const bufer: Buffer = Buffer.from(data);

        return callPromised(serialPort.write, bufer, encode);
      },
      close(): Promise<void> {
        return callPromised(serialPort.close);
      },
      onData(cb: (data: Uint8Array | string) => void) {
        serialPort.on('data', (receivedBuffer: Buffer) => {
          if (Buffer.isBuffer(receivedBuffer)) {
            throw new Error(`Unknown type of returned value "${JSON.stringify(receivedBuffer)}"`);
          }

          // TODO: может ли тут прийти строка????
          // TODO: если буфер пустой значит ли это что это пустая строка????

          return cb(convertBufferToUint8Array(receivedBuffer));
        });
      },
      onError(cb: (err: string) => void) {
        // TODO: check
        serialPort.on('error', (error: { message: string }) => {
          cb(error.message);
        });
      },
      onOpen(cb: () => void) {
        serialPort.on('open', cb);
      }
    };
  }


  // private prepareBinaryDataToWrite(data: Uint8Array): any {
  //   return Buffer.from(data);
  // }

  // private convertIncomeBinaryData(data: any): Uint8Array {
  //   if (Buffer.isBuffer(data)) throw new Error(`Unknown type of returned value "${JSON.stringify(data)}"`);
  //
  //   return convertBufferToUint8Array(data as Buffer);
  // }

}
