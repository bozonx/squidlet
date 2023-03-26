const i2c = require('i2c');

import I2cMasterIo from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/I2cMasterIo.js';
import {callPromised} from '../squidlet-lib/src/common';
import {convertBufferToUint8Array} from '../squidlet-lib/src/buffer';
import I2cMasterIoBase from '__old/platforms/lowjs/I2cMasterIoBase';
import {I2cMasterBusLike, I2cParams} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/I2cMasterIo.js';


export default class I2cMaster extends I2cMasterIoBase implements I2cMasterIo {
  protected async createConnection(busNum: number, params: I2cParams): Promise<I2cMasterBusLike> {
    if (typeof params.pinSDA === 'undefined') {
      throw new Error(`Can't create a connection to I2C master bus number ${busNum}: no "pinSDA" param`);
    }
    else if (typeof params.pinSCL === 'undefined') {
      throw new Error(`Can't create a connection to I2C master bus number ${busNum}: no "pinSCL" param`);
    }

    const i2cBus: any = new i2c.I2C(params);

    return {
      read: async (addrHex: number, quantity: number): Promise<Uint8Array> => {
        //const result: Buffer = await callPromised(this.getI2cBus(bus).read, addrHex, quantity);
        const result: Buffer = await callPromised(i2cBus.transfer.bind(i2cBus), addrHex, null, quantity);

        return convertBufferToUint8Array(result);
      },
      write: async (addrHex: number, data: Uint8Array): Promise<void> => {
        const buffer = Buffer.from(data);
        //await callPromised(this.getI2cBus(bus).write, addrHex, buffer);
        await callPromised(i2cBus.transfer.bind(i2cBus), addrHex, buffer, 0);
      },
      destroy: async () => i2cBus.destroy(),
    };
  }

}
