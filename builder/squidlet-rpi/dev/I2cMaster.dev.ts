// See interface in squidlet/host/src/app/interfaces/dev/I2cMaster.dev.ts

import * as i2cBusModule from 'i2c-bus';
import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';


/**
 * It's raspberry pi implementation of I2C master.
 */
export class I2cMasterDev {
  private readonly bus: i2cBusModule.I2cBus;

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: number) {
    this.bus = i2cBusModule.openSync(Number(bus));
  }

  writeTo(addrHex: number, data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesWritten: number) => {
        if (err) return reject(err);

        if (length !== bytesWritten) {
          return reject(new Error(
            `Wrong number of bytes was written. Sent ${length}, eventually written ${bytesWritten}`
          ));
        }

        resolve();
      };

      this.bus.i2cWrite(addrHex, length, buffer, callback);
    });
  }

  readFrom(addrHex: number, quantity: number): Promise<Uint8Array> {
    const bufferToRead = new Buffer(quantity);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesRead: number, resultBuffer: Buffer) => {
        if (err) return reject(err);

        if (quantity !== bytesRead) {
          return reject(new Error(
            `Wrong number of bytes was read. Sent ${quantity}, eventually read ${bytesRead}`
          ));
        }

        // convert to Uint8Array
        const uIntArr = new Uint8Array(quantity);
        for(let i = 0; i < quantity; i++) {
          uIntArr[i] = resultBuffer.readInt8(i);
        }

        resolve();
      };

      this.bus.i2cRead(addrHex, quantity, bufferToRead, callback);
    });
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: number
    ): I2cMasterDev } = I2cMasterDev;
}
