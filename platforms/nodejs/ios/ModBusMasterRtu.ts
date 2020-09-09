import Modbus, {ModbusRTUClient} from 'jsmodbus';
import {IUserRequestResolve} from 'jsmodbus/dist/user-request';
import ModbusRTURequest from 'jsmodbus/dist/rtu-request';
const SerialPort = require('serialport');

import ModBusMasterRtuIo, {ModbusDefinition, ModbusParams} from 'system/interfaces/io/ModBusMasterRtuIo';
import IoContext from 'system/interfaces/IoContext';


export default class ModBusMasterRtu implements ModBusMasterRtuIo {
  protected definition?: ModbusDefinition;
  private ioContext?: IoContext;
  protected instances: Record<string, ModbusRTUClient> = {};


  /**
   * Initialize platforms Item at System initialization time. It isn't allowed to call it more than once.
   */
  async init(ioContext: IoContext): Promise<void> {
    this.ioContext = ioContext;

    if (!this.definition) {
      throw new Error(`No modbus port definitions`);
    }

    return Promise.all(Object.keys(this.definition.ports).map((portNum: string) => {
      return this.makePortItem(portNum, this.definition.ports[portNum])
        .then((item: ModbusRTUClient) => this.instances[portNum] = item);
    })).then();
  }

  /**
   * Setup props before init.
   * It allowed to call it more than once.
   */
  async configure(definition: ModbusDefinition) {
    this.definition = definition;
  }

  async destroy(): Promise<void> {
    // TODO: add!
  }


  async readCoils(portNum: number | string, start: number, count: number): Promise<number[]> {
    const result: IUserRequestResolve<ModbusRTURequest> = await this.getPort(portNum)
      .readCoils(start, count);
    // TODO: check result
    console.log(11111111, result);

    return [];
  }

  async readDiscreteInputs(portNum: number | string, start: number, count: number): Promise<number[]> {
    const result: IUserRequestResolve<ModbusRTURequest> = await this.getPort(portNum)
      .readDiscreteInputs(start, count);
    // TODO: check result
    console.log(11111111, result);

    return [];
  }

  async readHoldingRegisters(portNum: number | string, start: number, count: number): Promise<Uint8Array> {
    const result: IUserRequestResolve<ModbusRTURequest> = await this.getPort(portNum)
      .readHoldingRegisters(start, count);
    // TODO: check result
    console.log(11111111, result);

    return new Uint8Array();
  }

  async readInputRegisters(
    portNum: number | string,
    start: number,
    count: number
  ): Promise<Uint8Array> {
    const result: IUserRequestResolve<ModbusRTURequest> = await this.getPort(portNum)
      .readInputRegisters(start, count);
    // TODO: check result
    console.log(11111111, result);

    return new Uint8Array();
  }

  async writeSingleCoil(
    portNum: number | string,
    address: number,
    value: boolean | 0 | 1
  ): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeSingleCoil(address, value);
  }

  async writeSingleRegister(
    portNum: number | string,
    address: number,
    value: number
  ): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeSingleRegister(address, value);
  }

  async writeMultipleCoils(
    portNum: number | string,
    start: number,
    values: boolean[]
  ): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeMultipleCoils(start, values);
  }

  async writeMultipleRegisters(
    portNum: number | string,
    start: number,
    values: Uint8Array
  ): Promise<void> {
    // TODO: check result
    await this.getPort(portNum).writeMultipleRegisters(start, [...values]);
  }

  private getPort(portNum: number | string): ModbusRTUClient {
    if (!this.instances[portNum]) {
      throw new Error(`ModBusMasterRtu: port "${portNum}" hasn't been instantiated`);
    }

    return this.instances[portNum];
  }


  protected async makePortItem(portNum: string, params: ModbusParams): Promise<ModbusRTUClient> {

  }

}
