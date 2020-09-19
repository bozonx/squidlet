/*
 * See example https://www.npmjs.com/package/pcf8574.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';

import {I2cMaster, I2cMasterDriverProps} from '../../../entities/drivers/I2cMaster/I2cMaster';


// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<I2cMasterDriverProps> {
  private i2c!: I2cMaster;


  init = async () => {
    this.depsInstances.i2c = await this.context.getSubDriver(
      'I2cMaster',
      this.props
    );
  }

  destroy = async () => {
  }


  /**
   * Read whole state of IC.
   * If IC has 8 pins then one byte will be returned if 16 then 2 bytes.
   */
  async readState(): Promise<Uint8Array> {
    return this.i2c.read(DATA_LENGTH);
  }

  /**
   * Write whole state to IC.
   * If IC has 8 pins then pass 1 byte if 16 then 2 bytes.
   */
  writeState(state: Uint8Array): Promise<void> {
    if (state.length !== DATA_LENGTH) {
      throw new Error(`It is able to write 1 byte of state to IC`);
    }

    return this.i2c.write(state);
  }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
