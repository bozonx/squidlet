import {CastRequestBody} from 'jsmodbus/dist/request-response-map';

const Modbus = require('jsmodbus');
const SerialPort = require('serialport');

import ModBusMasterRtuIo from 'system/interfaces/io/ModBusMasterRtuIo';
import IoContext from 'system/interfaces/IoContext';
import {
  ReadCoilsRequestBody,
  ReadDiscreteInputsRequestBody,
  ReadHoldingRegistersRequestBody,
  ReadInputRegistersRequestBody, WriteMultipleCoilsRequestBody, WriteMultipleRegistersRequestBody,
  WriteSingleCoilRequestBody,
  WriteSingleRegisterRequestBody
} from 'jsmodbus/dist/request';
import {PromiseUserRequest} from 'jsmodbus/dist/user-request';

// // create a tcp modbus client
// const Modbus = require('jsmodbus')
// const SerialPort = require('serialport')
// const options = {
//   baudRate: 57600
// }
// const socket = new SerialPort("/dev/tty-usbserial1", options)
// const client = new Modbus.client.RTU(socket, address)
//

export default class ModBusMasterRs485 implements ModBusMasterRtuIo {
  private ioContext?: IoContext;

  /**
   * Initialize platforms Item at System initialization time. It isn't allowed to call it more than once.
   */
  init(ioContext: IoContext): Promise<void> {
    this.ioContext = ioContext;
  }

  /**
   * Setup props before init.
   * It allowed to call it more than once.
   */
  configure(definition?: any): Promise<void> {
    const options = {
      baudRate: 9600,
      parity: 'none',
      dataBits: 8,
      stopBits: 1,
    };
  }

  destroy(): Promise<void> {

  }


  readCoils(portNum: number | string, start: number, count: number): Promise<number[]> {

  }

  readDiscreteInputs(portNum: number | string, start: number, count: number): Promise<number[]> {

  }

  readHoldingRegisters(portNum: number | string, start: number, count: number): Promise<Uint8Array> {

  }

  readInputRegisters(portNum: number | string, start: number, count: number): Promise<Uint8Array> {

  }

  writeSingleCoil(portNum: number | string, address: number, value: boolean | 0 | 1): Promise<void> {

  }

  writeSingleRegister(portNum: number | string, address: number, value: number): Promise<void> {

  }

  // writeMultipleCoils(portNum: number | string, start: number, values: boolean[]): PromiseUserRequest<CastRequestBody<Req, WriteMultipleCoilsRequestBody>> {
  //
  // }
  //
  // writeMultipleCoils(portNum: number | string, start: number, values: Buffer, quantity: number): PromiseUserRequest<CastRequestBody<Req, WriteMultipleCoilsRequestBody>> {
  //
  // }
  //
  // writeMultipleRegisters(portNum: number | string, start: number, values: number[] | Buffer): Promise<import("./user-request").IUserRequestResolve<CastRequestBody<Req, WriteMultipleRegistersRequestBody>>> {
  //
  // }

}
