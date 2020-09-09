import Modbus, {ModbusRTUClient} from 'jsmodbus';
import {IUserRequestResolve} from 'jsmodbus/dist/user-request';
import ModbusRTURequest from 'jsmodbus/dist/rtu-request';
const SerialPort = require('serialport');

import ModBusMasterRtuIo, {ModbusDefinition, ModbusParams} from 'system/interfaces/io/ModBusMasterRtuIo';
import IoContext from 'system/interfaces/IoContext';


export default class ModBusMasterRtu implements ModBusMasterRtuIo {
  private ioContext?: IoContext;
  private definition?: ModbusDefinition;
  private instances: Record<string, ModbusRTUClient> = {};


  /**
   * Initialize platforms Item at System initialization time. It isn't allowed to call it more than once.
   */
  async init(ioContext: IoContext): Promise<void> {
    this.ioContext = ioContext;
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


  async readCoils(
    portNum: number | string,
    slaveId: number,
    start: number,
    count: number
  ): Promise<number[]> {
    const instance = await this.getInstance(portNum, slaveId);
    const result: IUserRequestResolve<ModbusRTURequest> = await instance
      .readCoils(start, count);
    // TODO: check result
    console.log(11111111, result);

    return [];
  }

  async readDiscreteInputs(
    portNum: number | string,
    slaveId: number,
    start: number,
    count: number
  ): Promise<number[]> {
    const instance = await this.getInstance(portNum, slaveId);
    const result: IUserRequestResolve<ModbusRTURequest> = await instance
      .readDiscreteInputs(start, count);
    // TODO: check result
    console.log(11111111, result);

    return [];
  }

  async readHoldingRegisters(
    portNum: number | string,
    slaveId: number,
    start: number,
    count: number
  ): Promise<Uint8Array> {
    const instance = await this.getInstance(portNum, slaveId);
    const result: IUserRequestResolve<ModbusRTURequest> = await instance
      .readHoldingRegisters(start, count);
    // TODO: check result
    console.log(11111111, result);

    // TODO: add handle error

    return new Uint8Array();
  }

  async readInputRegisters(
    portNum: number | string,
    slaveId: number,
    start: number,
    count: number
  ): Promise<Uint8Array> {
    const instance = await this.getInstance(portNum, slaveId);
    const result: IUserRequestResolve<ModbusRTURequest> = await instance
      .readInputRegisters(start, count);
    // TODO: check result
    console.log(11111111, result);

    return new Uint8Array();
  }

  async writeSingleCoil(
    portNum: number | string,
    slaveId: number,
    address: number,
    value: boolean | 0 | 1
  ): Promise<void> {
    const instance = await this.getInstance(portNum, slaveId);
    // TODO: check result
    await instance.writeSingleCoil(address, value);
  }

  async writeSingleRegister(
    portNum: number | string,
    slaveId: number,
    address: number,
    value: number
  ): Promise<void> {
    const instance = await this.getInstance(portNum, slaveId);
    // TODO: check result
    await instance.writeSingleRegister(address, value);
  }

  async writeMultipleCoils(
    portNum: number | string,
    slaveId: number,
    start: number,
    values: boolean[]
  ): Promise<void> {
    const instance = await this.getInstance(portNum, slaveId);
    // TODO: check result
    await instance.writeMultipleCoils(start, values);
  }

  async writeMultipleRegisters(
    portNum: number | string,
    slaveId: number,
    start: number,
    values: Uint8Array
  ): Promise<void> {
    const instance = await this.getInstance(portNum, slaveId);
    // TODO: check result
    await instance.writeMultipleRegisters(start, [...values]);
  }


  private async getInstance(portNum: number | string, slaveId: number): Promise<ModbusRTUClient> {
    const instanceId: string = this.makeInstanceId(portNum, slaveId);

    if (!this.instances[instanceId]) {
      throw new Error(
        `ModBusMasterRtu: slave ${slaveId} on port "${portNum}" hasn't been instantiated`
      );
    }


    if (!this.definition) {
      throw new Error(`No modbus port definitions`);
    }

    return Promise.all(Object.keys(this.definition.ports).map((portNum: string) => {
      return this.makeInstance(portNum, this.definition!.ports[portNum])
        .then((item: ModbusRTUClient) => this.instances[portNum] = item);
    })).then();

    return this.instances[instanceId];
  }

  private async makeInstance(portNum: string, params: ModbusParams): Promise<ModbusRTUClient> {
    const combinedParams: ModbusParams = {
      // TODO: add default params ???
      ...params,
    };

    const options = {
      baudRate: 9600,
      parity: 'none',
      dataBits: 8,
      stopBits: 1,
    };

    const socket = new SerialPort('/dev/ttyUSB1', options);
    const client = new Modbus.client.RTU(socket, slaveAddress);
  }

  private makeInstanceId(portNum: number | string, slaveId: number): string {
    return `${portNum}${slaveId}`;
  }

}
