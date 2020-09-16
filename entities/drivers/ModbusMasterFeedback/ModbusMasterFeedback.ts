import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import ModBusMasterRtuIo from 'system/interfaces/io/ModBusMasterRtuIo';


export interface ModbusMasterDriverProps {
  portNum: number;
  slaveId: number;
}


// TODO: use Sender ???


export class ModbusMasterFeedback extends DriverBase<ModbusMasterDriverProps> {
  private modBusIo!: ModBusMasterRtuIo;


  init = async () => {
    this.modBusIo = this.context.getIo('ModBusMasterRtu');
  }


  async readCoils(start: number, count: number): Promise<boolean[]> {
    return this.modBusIo.readCoils(
      this.props.portNum,
      this.props.slaveId,
      start,
      count
    );
  }

  async readDiscreteInputs(start: number, count: number): Promise<boolean[]> {
    return this.modBusIo.readDiscreteInputs(
      this.props.portNum,
      this.props.slaveId,
      start,
      count
    );
  }

  async readHoldingRegisters(start: number, count: number): Promise<Uint16Array> {
    return this.modBusIo.readHoldingRegisters(
      this.props.portNum,
      this.props.slaveId,
      start,
      count
    );
  }

  async readInputRegisters(start: number, count: number): Promise<Uint16Array> {
    return this.modBusIo.readInputRegisters(
      this.props.portNum,
      this.props.slaveId,
      start,
      count
    );
  }

  async writeSingleCoil(address: number, value: boolean): Promise<void> {
    return this.modBusIo.writeSingleCoil(
      this.props.portNum,
      this.props.slaveId,
      address,
      value
    );
  }

  async writeSingleRegister(address: number, value: number): Promise<void> {
    return this.modBusIo.writeSingleRegister(
      this.props.portNum,
      this.props.slaveId,
      address,
      value
    );
  }

  async writeMultipleCoils(start: number, values: boolean[]): Promise<void> {

    // TODO: проверять длину тут или в IO

    // if (result.length !== length) {
    //   throw new Error(
    //     `PollOnceModbusЖ Invalid length of readPackageLength result: ${result.length}, ` +
    //     `Expected: ${READ_PACKAGE_LENGTH_COUNT}`
    //   );
    // }


    return this.modBusIo.writeMultipleCoils(
      this.props.portNum,
      this.props.slaveId,
      start,
      values
    );
  }

  async writeMultipleRegisters(start: number, values: Uint16Array): Promise<void> {
    return this.modBusIo.writeMultipleRegisters(
      this.props.portNum,
      this.props.slaveId,
      start,
      values
    );
  }

}


export default class Factory extends DriverFactoryBase<ModbusMaster, ModbusMasterDriverProps> {
  protected SubDriverClass = ModbusMaster;
  protected instanceId = (props: ModbusMasterDriverProps): string => {
    return `${props.portNum}-${props.slaveId}`;
  }
}
