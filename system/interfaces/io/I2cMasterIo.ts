import IoItem from '../IoItem';


export interface I2cParams {
  // bus number on raspberry pi like hosts
  bus?: string | number;
  // SDA pin on micro-controller
  pinSDA?: number;
  // SDA pin on micro-controller
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
  'newBus',
  'destroyBus',
  'writeTo',
  'readFrom',
];


export default interface I2cMasterIo extends IoItem {
  configure(newDefinition: I2cDefinition): Promise<void>;
  destroy(): Promise<void>;

  /**
   * New bus instance
   */
  newBus(busNum: number | undefined, paramsOverride: I2cParams): Promise<number>;

  /**
   * Destroy bus instance
   */
  destroyBus(portNum: number): Promise<void>;

  // TODO: можно ли чтобы data была undefined?
  writeTo(busNum: number, addrHex: number, data: Uint8Array): Promise<void>;
  readFrom(busNum: number, addrHex: number, quantity: number): Promise<Uint8Array>;
}
