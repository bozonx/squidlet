import CallFunctionBase from 'system/lib/remoteFunctionProtocol/CallFunctionBase';
import {ModbusMaster} from '../../entities/drivers/ModbusMaster/ModbusMaster';
import {uint8ToUint16} from '../../system/lib/binaryHelpers';


const WRITE_START_INDEX = 0;


export default class CallFunctionModbus extends CallFunctionBase {
  private readonly modbusMasterDriver: ModbusMaster;


  constructor(modbusMasterDriver: ModbusMaster) {
    super();
    this.modbusMasterDriver = modbusMasterDriver;
  }


  protected async writePackage(packageData: Uint8Array): Promise<void> {

    console.log(1111111, packageData)

    const package16Bit: Uint16Array = uint8ToUint16(packageData);

    await this.modbusMasterDriver.writeMultipleRegisters(WRITE_START_INDEX, package16Bit);
  }

}
