
// TODO: remove ???


import {defaultI2cParams, I2cDefinition, I2cMasterBusLike, I2cParams} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/I2cMasterIo.js';


let preDefinedBusesParams: {[index: string]: I2cParams} = {};
let unnamedBusNumIndex = 0;



export default abstract class I2cMasterIoBase {
  private readonly instances: {[index: string]: I2cMasterBusLike} = {};


  protected abstract createConnection(busNum: number, params: I2cParams): Promise<I2cMasterBusLike>;


  async init(newDefinition: I2cDefinition) {
    preDefinedBusesParams = newDefinition.buses;
  }

  async destroy() {
    for (let busNum of Object.keys(this.instances)) {
      await this.destroyBus(Number(busNum));
    }
  }

  async newBus(busNum: number | undefined, paramsOverride: I2cParams): Promise<number> {
    const resolvedBusNum = this.resolveBusNum(busNum);

    if (!this.instances[resolvedBusNum]) {
      this.instances[resolvedBusNum] = await this.makeBusItem(resolvedBusNum, paramsOverride);
    }

    return resolvedBusNum;
  }

  async destroyBus(busNum: number): Promise<void> {
    this.instances[busNum].destroy();
    delete this.instances[busNum];
  }

  async writeTo(busNum: number, addrHex: number, data: Uint8Array): Promise<void> {
    await this.getItem(busNum).write(addrHex, data);
  }

  async readFrom(busNum: number, addrHex: number, quantity: number): Promise<Uint8Array> {
    return await this.getItem(busNum).read(addrHex, quantity);
  }


  protected getItem(busNum: number): I2cMasterBusLike {
    if (!this.instances[busNum]) {
      throw new Error(`I2cMaster IO: bus number "${busNum}" hasn't been instantiated`);
      //this.instances[busNum] = await this.newBus(busNum);
    }

    return this.instances[busNum];
  }

  protected resolveBusNum(busNum: number | undefined): number {
    if (typeof busNum === 'number') return busNum;

    unnamedBusNumIndex++;

    return unnamedBusNumIndex;
  }

  protected getPreDefinedBusesParams(): {[index: string]: I2cParams} {
    return preDefinedBusesParams;
  }

  protected async makeBusItem(busNum: number, paramsOverride: I2cParams): Promise<I2cMasterBusLike> {
    const params = {
      ...defaultI2cParams,
      ...this.getPreDefinedBusesParams()[busNum],
      ...paramsOverride,
    };

    return this.createConnection(busNum, params);
  }

}
