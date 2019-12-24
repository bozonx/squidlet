import I2cMasterIo, {I2cMasterBusLike, I2cParams} from 'system/interfaces/io/I2cMasterIo';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import I2cMasterIoBase from 'system/lib/base/I2cMasterIoBase';
import {callPromised} from 'system/lib/common';
import instantiatePigpioClient, {PigpioClient} from '../helpers/PigpioClient';
import {PigpioOptions} from '../helpers/PigpioPinWrapper';


/**
 * It's raspberry pi implementation of I2C master.
 * It doesn't support setting clock. You should set it in your OS.
 */
export default class I2cMaster extends I2cMasterIoBase implements I2cMasterIo {
  private readonly client: PigpioClient;


  constructor() {
    super();

    this.client = instantiatePigpioClient({
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.log,
    });
  }


  async destroy(): Promise<void> {
    await this.client.destroy();
  }

  async configure(clientOptions: PigpioOptions): Promise<void> {
    // make init but don't wait while it has been finished
    this.client.init(clientOptions);
  }


  protected async createConnection(busNum: number, params: I2cParams): Promise<I2cMasterBusLike> {
    if (typeof params.bus === 'undefined') {
      throw new Error(`Can't create a connection to I2C master bus number ${busNum}: no "bus" param`);
    }

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
      destroy: () => callPromised(i2cBus.close.bind(i2cBus)),
    };
  }

}
