const i2c = require('i2c');

import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import I2cMasterIoBase from 'system/base/I2cMasterIoBase';
import {I2cMasterBusLike, I2cParams} from 'system/interfaces/io/I2cMasterIo';


export default class I2cMaster extends I2cMasterIoBase implements I2cMasterIo {
  protected async createConnection(busNum: number, params: I2cParams): Promise<I2cMasterBusLike> {
    const i2Bus: any = new i2c.I2C(params);

    // pinSDA: 8,
    // pinSCL: 9,
    // clockHz: 100000,

    return {
      async read(addrHex: number, quantity: number): Promise<Uint8Array> {
        //const result: Buffer = await callPromised(this.getI2cBus(bus).read, addrHex, quantity);
        const item: any = this.getItem(busNum);
        const result: Buffer = await callPromised(item.transfer.bind(item), addrHex, null, quantity);

        return convertBufferToUint8Array(result);
      },
      async write(addrHex: number, data: Uint8Array): Promise<void> {
        const buffer = Buffer.from(data);
        const item: any = this.getItem(busNum);
        //await callPromised(this.getI2cBus(bus).write, addrHex, buffer);
        await callPromised(item.transfer.bind(item), addrHex, buffer, 0);
      },
      destroy: i2Bus.destroy.bind(i2Bus),
    };
  }

}
