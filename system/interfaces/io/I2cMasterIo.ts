import IoItem from '../IoItem';
import IoManager from '../../managers/IoManager';


export interface I2cBusParams {
  // bus number on raspberry pi like hosts
  //bus?: string | number;
  // SDA pin on micro-controller
  pinSDA?: number;
  // SCL pin on micro-controller
  pinSCL?: number;
  // bus frequency. Default is 100000
  clockHz: number;
}

export interface I2cDefinition {
  buses: {[index: string]: I2cBusParams};
}

// low level instance interface
export interface I2cMasterBusLike {
  read(addrHex: number, quantity: number): Promise<Uint8Array>;
  write(addrHex: number, data: Uint8Array): Promise<void>;
  destroy(): Promise<void>;
}


export const defaultI2cParams: I2cBusParams = {
  clockHz: 100000,
};

export const Methods = [
  'init',
  'destroy',
  'i2cWriteDevice',
  'i2cReadDevice',
  'destroyBus',
];


export default interface I2cMasterIo extends IoItem {
  init(ioManager: IoManager, definition: I2cDefinition): Promise<void>;
  destroy(): Promise<void>;
  i2cWriteDevice(busNum: string | number, addrHex: number, data: Uint8Array): Promise<void>;
  i2cReadDevice(busNum: string | number, addrHex: number, count: number): Promise<Uint8Array>;
  destroyBus(busNum: string | number): Promise<void>;
}
