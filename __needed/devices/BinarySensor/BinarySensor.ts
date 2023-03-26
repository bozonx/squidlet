import DeviceBase from '__old/system/base/DeviceBase';
import {Dictionary} from '../squidlet-lib/src/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';

import {BinaryInput, BinaryInputProps} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/drivers/BinaryInput/BinaryInput.js';


interface Props extends BinaryInputProps {
}


export default class BinarySensor extends DeviceBase<Props> {
  private get binaryInput(): BinaryInput {
    return this.depsInstances.binaryInput;
  }


  protected async didInit() {
    this.depsInstances.binaryInput = await this.context.getSubDriver('BinaryInput', this.props);
    // listen driver's change
    this.binaryInput.onChange(this.onInputChange);
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    // TODO: нужно ли тут делать read ???? делается до инициализации gpio
    return { [DEFAULT_DEVICE_STATUS]: await this.binaryInput.read() };
  }


  private onInputChange = async (level: boolean) => {
    await this.setStatus(level);
  }

}
