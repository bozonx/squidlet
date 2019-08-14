import DeviceBase, {DEFAULT_STATUS} from 'system/baseDevice/DeviceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {Dictionary} from 'system/interfaces/Types';

import {BinaryInput, BinaryInputProps} from '../../drivers/BinaryInput/BinaryInput';


interface Props extends BinaryInputProps {
}


export default class BinarySensor extends DeviceBase<Props> {
  private get binaryInput(): BinaryInput {
    return this.depsInstances.binaryInput;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  }


  private onInputChange = async (level: boolean) => {
    await this.setStatus(level);
  }

}
