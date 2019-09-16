const i2c = require('i2c');

import I2cMasterIo, {I2cDefinition, I2cParams} from 'system/interfaces/io/I2cMasterIo';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';


let preDefinedBusesParams: {[index: string]: I2cParams} = {};
let unnamedBusNumIndex = 0;


export default class I2cMaster implements I2cMasterIo {
  private readonly instances: {[index: string]: any} = {};


  async configure(newDefinition: I2cDefinition) {
    preDefinedBusesParams = newDefinition.ports;
  }

  async destroy() {
    for (let busNum of Object.keys(this.instances)) {
      await this.destroyBus(busNum);
    }
  }


  async newBus(busNum: number | undefined, paramsOverride: I2cParams): Promise<number> {
    const resolvedPortNum = this.resolveBusNum(busNum);

    if (!this.instances[resolvedPortNum]) {
      this.instances[resolvedPortNum] = await this.makePortItem(resolvedPortNum, paramsOverride);
    }

    return resolvedPortNum;
  }

  async destroyBus(portNum: number): Promise<void> {
    this.instances[portNum].destroy();
    delete this.instances[portNum];
  }

  async writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);

    //await callPromised(this.getI2cBus(bus).write, addrHex, buffer);
    await callPromised(
      this.getI2cBus(bus).transfer.bind(this.getI2cBus(bus)),
      addrHex,
      buffer,
      0
    );
  }

  async readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array> {
    //const result: Buffer = await callPromised(this.getI2cBus(bus).read, addrHex, quantity);
    const result: Buffer = await callPromised(
      this.getI2cBus(bus).transfer.bind(this.getI2cBus(bus)),
      addrHex,
      null,
      quantity
    );

    return convertBufferToUint8Array(result);
  }


  private getI2cBus(bus: string): any {
    if (this.instances[bus]) return this.instances[bus];

    // TODO: взять конфиг из ранее скорфигурированного bus

    this.instances[bus] = new i2c.I2C({
      pinSDA: 8,
      pinSCL: 9,
      clockHz: 100000,
    });

    return this.instances[bus];
  }


  protected resolveBusNum(busNum: number | undefined): number {
    if (typeof busNum === 'number') return busNum;

    unnamedBusNumIndex++;

    return unnamedBusNumIndex;
  }

}
