import {I2cMasterBusLike, I2cParams} from '../../system/interfaces/io/I2cMasterIo';

const i2c = require('i2c');

import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import I2cMasterIoBase from 'system/base/I2cMasterIoBase';


export default class I2cMaster extends I2cMasterIoBase implements I2cMasterIo {
  createConnection(busNum: number, params: I2cParams): Promise<I2cMasterBusLike> {
    if (this.instances[bus]) return this.instances[bus];

    // TODO: взять конфиг из ранее скорфигурированного bus

    this.instances[bus] = new i2c.I2C({
      pinSDA: 8,
      pinSCL: 9,
      clockHz: 100000,
    });

    return this.instances[bus];
  }


  async writeTo(busNum: number, addrHex: number, data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);

    //await callPromised(this.getI2cBus(bus).write, addrHex, buffer);
    await callPromised(
      this.getItem(busNum).transfer.bind(this.getItem(busNum)),
      addrHex,
      buffer,
      0
    );
  }

  async readFrom(busNum: number, addrHex: number, quantity: number): Promise<Uint8Array> {
    //const result: Buffer = await callPromised(this.getI2cBus(bus).read, addrHex, quantity);
    const item: I2cMasterBusLike = this.getItem(busNum);
    const result: Buffer = await callPromised(item.transfer.bind(item), addrHex, null, quantity);

    return convertBufferToUint8Array(result);
  }

}
