import {I2cDefinition, I2cParams} from '../interfaces/io/I2cMasterIo';


let preDefinedBusesParams: {[index: string]: I2cParams} = {};
let unnamedBusNumIndex = 0;


export default class I2cMasterIoBase {
  // TODO: use I2cLike ???
  private readonly instances: {[index: string]: any} = {};


  async configure(newDefinition: I2cDefinition) {
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


  protected resolveBusNum(busNum: number | undefined): number {
    if (typeof busNum === 'number') return busNum;

    unnamedBusNumIndex++;

    return unnamedBusNumIndex;
  }

  protected makeBusItem(busNum: number, paramsOverride: I2cParams) {
    const params = {
      ...defaultI2cParams,
      ...paramsOverride,
    };
  }

}
