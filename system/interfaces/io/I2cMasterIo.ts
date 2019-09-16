import IoItem from '../IoItem';


export const Methods = [
  'destroy',
  'writeTo',
  'readFrom',
];


export default interface I2cMasterIo extends IoItem {
  destroy(): Promise<void>;
  writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void>;
  // TODO: можно ли чтобы data была undefined?
  readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array>;
}
