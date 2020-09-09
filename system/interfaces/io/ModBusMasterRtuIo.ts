import IoItem from '../IoItem';


export const Methods = [
  'init',
  'configure',
  'destroy',

  'readCoils',
  'readDiscreteInputs',
  'readHoldingRegisters',
  'readInputRegisters',
  'writeSingleCoil',
  'writeSingleRegister',
];


export default interface ModBusMasterRtuIo extends IoItem {
  readCoils(portNum: number | string, start: number, count: number): Promise<number[]>;
  readDiscreteInputs(portNum: number | string, start: number, count: number): Promise<number[]>;
  readHoldingRegisters(portNum: number | string, start: number, count: number): Promise<Uint8Array>;
  readInputRegisters(portNum: number | string, start: number, count: number): Promise<Uint8Array>;
  writeSingleCoil(portNum: number | string, address: number, value: boolean | 0 | 1): Promise<void>;
  writeSingleRegister(portNum: number | string, address: number, value: number): Promise<void>;
  writeMultipleCoils(portNum: number | string, start: number, values: boolean[]): Promise<void>;
  writeMultipleRegisters(portNum: number | string, start: number, values: Uint8Array): Promise<void>;
}
