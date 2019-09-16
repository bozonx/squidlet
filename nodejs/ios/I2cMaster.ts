import {I2cBus, openSync} from 'i2c-bus';

import I2cMasterIo, {I2cMasterBusLike, I2cParams} from 'system/interfaces/io/I2cMasterIo';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import I2cMasterIoBase from 'system/base/I2cMasterIoBase';


/**
 * It's raspberry pi implementation of I2C master.
 */
export default class I2cMaster extends I2cMasterIoBase implements I2cMasterIo {
  protected async createConnection(busNum: number, params: I2cParams): Promise<I2cMasterBusLike> {
    if (typeof params.bus === 'undefined') {
      throw new Error(`Can't create a connection to I2C master bus number ${busNum}: no "bus" param`);
    }

    // TODO: pass clock
    const i2cBus: I2cBus = openSync(Number(params.bus));

    return {
      read: async (addrHex: number, quantity: number): Promise<Uint8Array> => {
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

          i2cBus.i2cRead(addrHex, quantity, bufferToRead, callback);
        });
      },
      write: async (addrHex: number, data: Uint8Array): Promise<void> => {
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

          i2cBus.i2cWrite(addrHex, buffer.length, buffer, callback);
        });
      },
      // TODO: проверить
      destroy: i2Bus.destroy.bind(i2Bus),
    };
  }

}
