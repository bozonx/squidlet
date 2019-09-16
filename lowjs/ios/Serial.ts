const uart = require('uart');

import SerialIo, {SerialParams} from 'system/interfaces/io/SerialIo';
import SerialIoBase, {SerialPortLike} from 'system/base/SerialIoBase';
import {convertBufferToUint8Array} from 'system/lib/buffer';


export default class Serial extends SerialIoBase implements SerialIo {
  protected async createConnection(portNum: number, params: SerialParams): Promise<SerialPortLike> {
    let stream = new uart.UART({
      pinRX: params.pinRX,
      pinTX: params.pinTX,
      baud: params.baudRate,
      // TODO: add parity, stopBits and dataBits. see https://www.lowjs.org/lowjs_for_esp32/module-uart-UART.html
    });

    // TODO: нужно ли ждать on open????
    // TODO: есть ли close(cb)????

    return stream;
  }

  protected prepareBinaryDataToWrite(data: Uint8Array): any {
    return Buffer.from(data);
  }

  protected convertIncomeBinaryData(data: any): Uint8Array {
    if (Buffer.isBuffer(data)) throw new Error(`Unknown type of returned value "${JSON.stringify(data)}"`);

    return convertBufferToUint8Array(data as Buffer);
  }

}
