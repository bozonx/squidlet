import I2cMaster from '../../../host/src/app/interfaces/dev/I2cMaster';

// global instances of I2C buses
enum I2Cs {
  I2C1 = 1,
  I2C2,
  I2C3,
}

interface EspruinoI2cBus {
  writeTo(address: number, data: Uint8Array): void;
  readFrom(address: number, quantity: number): Uint8Array;
}

// TODO: поддержка i2c на любом пине - new I2C() -  use I2C.setup
// TODO; All addresses are in 7 bit format. If you have an 8 bit address then you need to shift it one bit to the right.


export default class I2cMasterDev implements I2cMaster {
  async writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void> {
  //async writeTo(bus: string, addrHex: number, data: Uint8Array | undefined): Promise<void> {
    if (!(typeof data === 'object' && data.constructor.name === 'Uint8Array')) {
      throw new Error(`Supports only a Uint8Array. Your data is ${JSON.stringify(data)}`);
    }

    this.getI2cBus(parseInt(bus)).writeTo(addrHex, data);
  }

  async readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array> {
    // TODO: add
    return this.getI2cBus(parseInt(bus)).readFrom(addrHex, quantity);
  }


  private getI2cBus(bus: I2Cs): EspruinoI2cBus {
    // TODO: проверить что будет работать
    return (global as any)[`I2C${bus}`];
  }

}
