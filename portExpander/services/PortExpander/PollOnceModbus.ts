import PollOnceBase from 'system/lib/remoteFunctionProtocol/PollOnceBase';
import {numToUint8Word, uint16ToUint8} from 'system/lib/binaryHelpers';

import {ModbusMaster} from '../../../entities/drivers/ModbusMaster/ModbusMaster';


enum READ_REGISTERS {
  length,
  package,
}

const READ_PACKAGE_LENGTH_COUNT = 1;


export default class PollOnceModbus extends PollOnceBase {
  private readonly modbusMasterDriver: ModbusMaster;


  constructor(modbusMasterDriver: ModbusMaster, logWarn: (msg: string) => void) {
    super(logWarn);

    this.modbusMasterDriver = modbusMasterDriver;
  }


  protected readLength = async (): Promise<number> => {
    const result: Uint16Array = await this.modbusMasterDriver
      .readInputRegisters(READ_REGISTERS.length, READ_PACKAGE_LENGTH_COUNT);

    const bytes: Uint8Array = numToUint8Word(result[0]);

    return bytes[1];
  }

  /**
   * Read package
   * @param length - count of 16 bit words
   */
  protected readPackage = async (length: number): Promise<Uint8Array> => {

    //return new Uint8Array([2,5,1])

    const result: Uint16Array = await this.modbusMasterDriver
      .readInputRegisters(READ_REGISTERS.package, length);

    console.log(11111111, result)

    return uint16ToUint8(result);
  }

}
