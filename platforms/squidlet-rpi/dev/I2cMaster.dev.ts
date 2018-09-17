import * as i2cBusModule from 'i2c-bus';
import DriverFactoryBase from '../../../host/src/app/entities/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/entities/DriverEnv';
import {EntityProps} from '../../../host/src/app/interfaces/EntityDefinition';
import I2cMaster from '../../../host/src/app/interfaces/dev/I2cMaster';


// TODO: иснтанс не нужен. инстансы i2c-bus можно хранить в модуле


/**
 * It's raspberry pi implementation of I2C master.
 */
export class I2cMasterDev implements I2cMaster {
  private readonly bus: i2cBusModule.I2cBus;

  constructor(props: EntityProps, env: DriverEnv, bus: number) {
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


export default new I2cMasterDev();
