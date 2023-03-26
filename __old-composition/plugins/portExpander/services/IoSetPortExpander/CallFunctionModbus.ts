import CallFunctionBase from '__old/system/lib/remoteFunctionProtocol/CallFunctionBase';
import {ModbusMaster} from '../../../entities/drivers/ModbusMaster/ModbusMaster';
import {uint8ToUint16} from '../../../system/lib/binaryHelpers';


const WRITE_START_INDEX = 0;

// TODO: remove - use connection


export default class CallFunctionModbus extends CallFunctionBase {
  private readonly modbusMasterDriver: ModbusMaster;


  constructor(modbusMasterDriver: ModbusMaster) {
    super();
    this.modbusMasterDriver = modbusMasterDriver;
  }


  protected async writePackage(packageData: Uint8Array): Promise<void> {
    const package16Bit: Uint16Array = uint8ToUint16(packageData);
    // const package16Bit: Uint16Array = uint8ToUint16(new Uint8Array([
    //   1, 10, 12,
    //   2, 11, 12, 5
    // ]));

    await this.modbusMasterDriver.writeMultipleRegisters(WRITE_START_INDEX, package16Bit);
  }

}
