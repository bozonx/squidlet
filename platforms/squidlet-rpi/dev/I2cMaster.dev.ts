import {I2cBus, openSync} from 'i2c-bus';
import I2cMaster from '../../../host/src/app/interfaces/dev/I2cMaster';


/**
 * It's raspberry pi implementation of I2C master.
 */
export default class I2cMasterDev implements I2cMaster {
  private readonly instances: {[index: string]: I2cBus} = {};


  writeTo(bus: number, addrHex: number, data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesWritten: number) => {
        if (err) return reject(err);

        if (data.length !== bytesWritten) {
          return reject(new Error(
            `Wrong number of bytes has been written. Tried to write ${data.length}, but eventually written ${bytesWritten}`
          ));
        }

        resolve();
      };

      this.getI2cBus(bus).i2cWrite(addrHex, data.length, buffer, callback);
    });
  }

  readFrom(bus: number, addrHex: number, quantity: number): Promise<Uint8Array> {
    const bufferToRead = new Buffer(quantity);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesRead: number, resultBuffer: Buffer) => {
        if (err) return reject(err);

        if (quantity !== bytesRead) {
          return reject(new Error(
            `Wrong number of bytes has been read. Sent ${quantity}, but eventually read ${bytesRead}`
          ));
        }

        // convert to Uint8Array
        const uIntArr: Uint8Array = this.convertBufferToUint8Array(resultBuffer);

        resolve(uIntArr);
      };

      this.getI2cBus(bus).i2cRead(addrHex, quantity, bufferToRead, callback);
    });
  }


  private getI2cBus(bus: number): I2cBus {
    if (this.instances[bus]) return this.instances[bus];

    this.instances[bus] = openSync(bus);

    return this.instances[bus];
  }

  private convertBufferToUint8Array(data: Buffer): Uint8Array {
    const uIntArr = new Uint8Array(data.length);

    for(let i = 0; i < data.length; i++) {
      uIntArr[i] = data.readInt8(i);
    }

    return uIntArr;
  }

}
