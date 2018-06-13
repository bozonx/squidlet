import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cMaster, { DriverInstance as I2cMasterInstance } from './I2cMaster.driver';
import MyAddress from '../app/interfaces/MyAddress';
import { hexToBytes } from '../helpers/helpers';


//const DATA_TRANSFER_REGISTER_POSITION = 0;
const DATA_MARK_POSITION = 0;
const DATA_MARK_LENGTH = 1;
const DATA_LENGTH_REQUEST = 2;

export class DriverInstance {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly eventName: string = 'data';
  private readonly i2cDriver: I2cMasterInstance;
  private readonly defaultDataMark: number = 0x00;
  private readonly lengthRegister: number = 0x1a;
  private readonly sendDataRegister: number = 0x1b;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;

    const driver: I2cMaster = this.drivers.getDriver('I2cMaster');
    this.i2cDriver = driver.getInstance(this.myAddress.bus, this.myAddress.address);
  }

  init(): void {
    this.i2cDriver.listen(this.lengthRegister, DATA_LENGTH_REQUEST, this.handleIncomeLength);
  }

  async send(dataMark: number | undefined, data: Uint8Array): Promise<void> {
    const completeDataMark = (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;
    const dataLength = data.length;

    await this.sendLength(dataLength);
    await this.sendData(completeDataMark, dataLength, data);
  }

  listenIncome(register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  removeListener(register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

  private handleIncomeLength = () => {
    // TODO: 111
  }

  private async sendLength(dataLength: number): Promise<void> {
    // 16 bit (2 bytes) integer
    if (dataLength > 65535) throw new Error(`Data is too long, allowed length until 65535 bytes`);

    // e.g 65535 => "ffff". To decode use - parseInt("ffff", 16)
    const lengthHex = dataLength.toString(16);
    const lengthToSend: Uint8Array = new Uint8Array(hexToBytes(lengthHex));

    this.i2cDriver.write(this.lengthRegister, lengthToSend);
  }

  private async sendData(dataMark: number, dataLength: number, data: Uint8Array): Promise<void> {
    const dataToSend: Uint8Array = new Uint8Array(dataLength + DATA_MARK_LENGTH);
    // add data mark
    dataToSend[DATA_MARK_POSITION] = dataMark;
    // TODO: упростить - использовать spread ???
    // fill array
    data.forEach((item, index) => dataToSend[index + DATA_MARK_LENGTH] = item);

    this.i2cDriver.write(this.sendDataRegister, dataToSend);
  }

}


export default class I2cMasterDataDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(myAddress: MyAddress) {
    return new DriverInstance(this.drivers, this.driverConfig, myAddress);
  }

}
