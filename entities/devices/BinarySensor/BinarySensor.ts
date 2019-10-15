import DeviceBase from 'system/base/DeviceBase';
import {Dictionary} from 'system/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';

import {BinaryInput, BinaryInputProps} from '../../drivers/BinaryInput/BinaryInput';


interface Props extends BinaryInputProps {
}


export default class BinarySensor extends DeviceBase<Props> {
  private get binaryInput(): BinaryInput {
    return this.depsInstances.binaryInput;
  }


  protected didInit = async () => {
    this.depsInstances.binaryInput = await this.context.getSubDriver('BinaryInput', this.props);
    // listen driver's change
    this.binaryInput.onChange(this.onInputChange);
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    return { [DEFAULT_DEVICE_STATUS]: await this.binaryInput.read() };
  }


  private onInputChange = async (level: boolean) => {
    await this.setStatus(level);
  }

}
