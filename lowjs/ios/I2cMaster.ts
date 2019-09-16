import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';


export default class I2cMaster implements I2cMasterIo {
  private readonly instances: {[index: string]: any} = {};

  // TODO: add configure

  async destroy() {
    for (let bus of Object.keys(this.instances)) {
      this.instances[bus].destroy();
      delete this.instances[bus];
    }
  }


  async writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);

    await callPromised(this.getI2cBus(bus).write, addrHex, buffer);
  }

  async readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array> {
    const result: Buffer = await callPromised(this.getI2cBus(bus).read, addrHex, quantity);

    return convertBufferToUint8Array(result);
  }


  private getI2cBus(bus: string): any {
    if (this.instances[bus]) return this.instances[bus];

    this.instances[bus] = openSync(parseInt(bus));

    return this.instances[bus];
  }

}
