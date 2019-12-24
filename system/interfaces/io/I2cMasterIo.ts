import IoItem from '../IoItem';


export interface I2cParams {
  // bus number on raspberry pi like hosts
  bus?: string | number;
  // SDA pin on micro-controller
  pinSDA?: number;
  // SCL pin on micro-controller
  pinSCL?: number;
  // bus frequency. Default is 100000
  clockHz: number;
}

export interface I2cDefinition {
  buses: {[index: string]: I2cParams};
}

// low level instance interface
export interface I2cMasterBusLike {
  read(addrHex: number, quantity: number): Promise<Uint8Array>;
  write(addrHex: number, data: Uint8Array): Promise<void>;
  destroy(): Promise<void>;
}


export const defaultI2cParams: I2cParams = {
  clockHz: 100000,
};

export const Methods = [
  'configure',
  'destroy',
  //'newBus',
  'i2cWriteDevice',
  'i2cReadDevice',
  'destroyBus',
];


export default interface I2cMasterIo extends IoItem {
  configure(newDefinition: I2cDefinition): Promise<void>;
  destroy(): Promise<void>;

  /**
   * Open a new bus or use previously instantiated one.
   * @busNum - number or name of bus in config.
   */
  //openBus(busNum: string | number): Promise<number>;
  //isBusOpened(busInstanceId: number): Promise<boolean>;
  // TODO: можно ли чтобы data была undefined?
  i2cWriteDevice(busNum: string | number, addrHex: number, data: Uint8Array): Promise<void>;
  i2cReadDevice(busNum: string | number, addrHex: number, count: number): Promise<Uint8Array>;
  destroyBus(busNum: string | number): Promise<void>;
}
