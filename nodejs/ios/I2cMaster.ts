import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import instantiatePigpioClient, {PigpioClient} from '../helpers/PigpioClient';
import {PigpioOptions} from '../helpers/PigpioPinWrapper';


/**
 * It's raspberry pi implementation of I2C master.
 * It doesn't support setting clock. You should set it in your OS.
 */
export default class I2cMaster implements I2cMasterIo {
  private readonly client: PigpioClient;
  // { `busNum-addressNum`: [ addressConnectionId ] }
  private openedAddresses: {[index: string]: number} = {};


  constructor() {
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

  // TODO: review
  async configure(clientOptions: PigpioOptions): Promise<void> {
    // make init but don't wait while it has been finished
    this.client.init(clientOptions);
  }

  // async openBus(busNum: string | number): Promise<number> {
  //   // TODO: как это связать с настроящим busInstanceId ????
  //   const busInstanceId: number = this.openedBuses.length;
  //
  //   this.openedBuses.push(busNum);
  //
  //   return busInstanceId;
  // }

  // async isBusOpened(busInstanceId: number): Promise<boolean> {
  //   // TODO: check on the server side
  //   return typeof this.openedBuses[busInstanceId] !== 'undefined';
  // }

  async i2cWriteDevice(busNum: string | number, addrHex: number, data: Uint8Array): Promise<void> {
    const addressConnectionId: number = await this.resolveAddressConnectionId(busNum, addrHex);

    // TODO: если произошка  ошибка err.code: 'PI_BAD_HANDLE' - то переконнектиться и повторить 1 раз

    return this.client.i2cWriteDevice(addressConnectionId, data);
  }

  async i2cReadDevice(busNum: string | number, addrHex: number, count: number): Promise<Uint8Array> {
    const addressConnectionId: number = await this.resolveAddressConnectionId(busNum, addrHex);

    // TODO: если произошка  ошибка err.code: 'PI_BAD_HANDLE' - то переконнектиться и повторить 1 раз

    return this.client.i2cReadDevice(addressConnectionId, count);
  }

  async destroyBus(busNum: string | number): Promise<void> {
    // TODO: что если произошла ошибка
    // TODO: нужно закрытьт все соединения с адресами
    await this.client.i2cClose(busInstanceId);

    this.openedBuses[busInstanceId] = undefined;
  }


  private async resolveAddressConnectionId(busNum: string | number, addrHex: number): Promise<number> {
    if (typeof busNum !== 'number') {
      throw new Error(`busNum has to be a number`);
    }

    const index: string = `${busNum}-${addrHex}`;

    if (typeof this.openedAddresses[index] !== 'undefined') return this.openedAddresses[index];

    const addressConnectionId: number = await this.client.i2cOpen(busNum, addrHex);

    this.openedAddresses[index] = addressConnectionId;

    return addressConnectionId;
  }

}
