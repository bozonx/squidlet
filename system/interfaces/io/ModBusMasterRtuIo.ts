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

  // writeMultipleCoils(portNum: number | string, start: number, values: boolean[]): PromiseUserRequest<CastRequestBody<Req, WriteMultipleCoilsRequestBody>>
  // writeMultipleCoils(portNum: number | string, start: number, values: Buffer, quantity: number): PromiseUserRequest<CastRequestBody<Req, WriteMultipleCoilsRequestBody>>
  // writeMultipleRegisters(portNum: number | string, start: number, values: number[] | Buffer): Promise<import("./user-request").IUserRequestResolve<CastRequestBody<Req, WriteMultipleRegistersRequestBody>>>
}
