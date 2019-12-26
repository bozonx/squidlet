import I2cMasterIo, {I2cDefinition} from 'system/interfaces/io/I2cMasterIo';
import IoManager from 'system/managers/IoManager';
import PigpioClient, {BAD_HANDLE_CODE} from './PigpioClient';


/**
 * It's raspberry pi implementation of I2C master.
 * It doesn't support setting clock. You should set it in your OS.
 */
export default class I2cMaster implements I2cMasterIo {
  private _client?: PigpioClient;
  private definition?: I2cDefinition;
  // { `${busNum}${addressNum}`: addressConnectionId }
  private openedAddresses: {[index: string]: number} = {};

  private get client(): PigpioClient {
    return this._client as any;
  }


  async init(ioManager: IoManager): Promise<void> {
    this._client = ioManager.getIo<PigpioClient>('PigpioClient');
  }


  async configure(definition: I2cDefinition): Promise<void> {
    this.definition = definition;
  }

  async destroy(): Promise<void> {
  }


  async i2cWriteDevice(busNum: string | number, addrHex: number, data: Uint8Array): Promise<void> {
    const addressConnectionId: number = await this.resolveAddressConnectionId(busNum, addrHex);

    try {
      await this.client.i2cWriteDevice(addressConnectionId, data);
    }
    catch (e) {
      if (e.code === BAD_HANDLE_CODE) {
        await this.handleBadHandle(busNum, addrHex);
        await this.client.i2cWriteDevice(addressConnectionId, data);
      }

      throw e;
    }
  }

  async i2cReadDevice(busNum: string | number, addrHex: number, count: number): Promise<Uint8Array> {
    const addressConnectionId: number = await this.resolveAddressConnectionId(busNum, addrHex);

    try {
      return await this.client.i2cReadDevice(addressConnectionId, count);
    }
    catch (e) {
      if (e.code === BAD_HANDLE_CODE) {
        await this.handleBadHandle(busNum, addrHex);
        return await this.client.i2cReadDevice(addressConnectionId, count);
      }

      throw e;
    }
  }

  async destroyBus(busNum: string | number): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let index of Object.keys(this.openedAddresses)) {
      if (index.indexOf(String(busNum)) !== 0) continue;

      promises.push(this.client.i2cClose(this.openedAddresses[index]));

      delete this.openedAddresses[index];
    }

    try {
      await Promise.all(promises);
    }
    catch (e) {
      console.error(e);
    }
  }


  private async handleBadHandle(busNum: string | number, addrHex: number) {
    const index: string = `${busNum}${addrHex}`;

    delete this.openedAddresses[index];

    this.openedAddresses[index] = await this.client.i2cOpen(parseInt(busNum as any), addrHex);
  }

  private async resolveAddressConnectionId(busNum: string | number, addrHex: number): Promise<number> {
    const index: string = `${busNum}${addrHex}`;

    if (typeof this.openedAddresses[index] !== 'undefined') return this.openedAddresses[index];
    // open a new connection
    const addressConnectionId: number = await this.client.i2cOpen(parseInt(busNum as any), addrHex);

    this.openedAddresses[index] = addressConnectionId;

    return addressConnectionId;
  }

}
