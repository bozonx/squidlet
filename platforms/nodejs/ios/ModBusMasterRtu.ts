import {CastRequestBody} from 'jsmodbus/dist/request-response-map';

import Modbus, {ModbusRTUClient} from 'jsmodbus';
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
import {IUserRequestResolve, PromiseUserRequest} from 'jsmodbus/dist/user-request';
import {ENCODE} from '../../../system/lib/constants';
import {ItemPosition} from '../../../system/lib/base/SerialIoBase';
import ModbusRTURequest from 'jsmodbus/dist/rtu-request';


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


  async readCoils(portNum: number | string, start: number, count: number): Promise<number[]> {
    const result: IUserRequestResolve = this.getPort(portNum).readCoils(start, count);


  }

  readDiscreteInputs(portNum: number | string, start: number, count: number): Promise<number[]> {

  }

  readHoldingRegisters(portNum: number | string, start: number, count: number): Promise<Uint8Array> {

  }

  async readInputRegisters(
    portNum: number | string,
    start: number,
    count: number
  ): Promise<Uint8Array> {
    const result: IUserRequestResolve<ModbusRTURequest> = await this.getPort(portNum).readInputRegisters(start, count);

    console.log(11111111, result);
  }

  async writeSingleCoil(portNum: number | string, address: number, value: boolean | 0 | 1): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeSingleCoil(address, value);
  }

  async writeSingleRegister(portNum: number | string, address: number, value: number): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeSingleRegister(address, value);
  }

  async writeMultipleCoils(portNum: number | string, start: number, values: boolean[]): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeMultipleCoils(start, values);
  }

  async writeMultipleRegisters(portNum: number | string, start: number, values: Uint8Array): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeMultipleRegisters(start, [...values]);
  }

  private getPort(portNum: number | string): ModbusRTUClient {

  }

}
