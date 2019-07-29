import {I2cBus, openSync} from 'i2c-bus';

import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import {convertBufferToUint8Array} from 'system/lib/buffer';


/**
 * It's raspberry pi implementation of I2C master.
 */
export default class I2cMaster implements I2cMasterIo {
  private readonly instances: {[index: string]: I2cBus} = {};


  // writeTo(bus: string, addrHex: number, data: Uint8Array | undefined): Promise<void> {
  //   const buffer = (data) ? Buffer.from(data) : new Buffer(0);
  writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesWritten: number) => {
        if (err) return reject(err);

        if (data && data.length !== bytesWritten) {
          return reject(new Error(
            `Wrong number of bytes has been written. Tried to write ${data.length}, but eventually written ${bytesWritten}`
          ));
        }

        resolve();
      };

      this.getI2cBus(bus).i2cWrite(addrHex, buffer.length, buffer, callback);
    });
  }

  readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array> {
    const bufferToRead = Buffer.alloc(quantity);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesRead: number, resultBuffer: Buffer) => {
        if (err) return reject(err);

        if (quantity !== bytesRead) {
          return reject(new Error(
            `Wrong number of bytes has been read. Sent ${quantity}, but eventually read ${bytesRead}`
          ));
        }

        // convert to Uint8Array
        const uIntArr: Uint8Array = convertBufferToUint8Array(resultBuffer);

        resolve(uIntArr);
      };

      console.log(9999999, bus, addrHex, quantity);

      this.getI2cBus(bus).i2cRead(addrHex, quantity, bufferToRead, callback);
    });
  }


  private getI2cBus(bus: string): I2cBus {
    if (this.instances[bus]) return this.instances[bus];

    this.instances[bus] = openSync(parseInt(bus));

    return this.instances[bus];
  }

}
