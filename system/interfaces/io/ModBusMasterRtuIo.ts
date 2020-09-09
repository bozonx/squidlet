import IoItem from '../IoItem';
import {BaudRate, SerialParams} from './SerialIo';


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
  'writeMultipleCoils',
  'writeMultipleRegisters',
];

export interface ModbusParams extends SerialParams {
  deRePin?: number;
}

export interface ModbusDefinition {
  // params of ports by portNum or port name
  ports: {[index: string]: ModbusParams};
  // TODO: add default baudRate
  // TODO: add default port
}

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
