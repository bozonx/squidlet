import DeviceBase, {DeviceBaseProps} from 'system/baseDevice/DeviceBase';
import {Data} from 'system/baseDevice/DeviceDataManagerBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {DEFAULT_STATUS} from 'system/baseDevice/StatusState';

import {BinaryInput, BinaryInputProps} from '../../drivers/BinaryInput/BinaryInput';


interface Props extends DeviceBaseProps, BinaryInputProps {
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


  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  }

  // protected transformPublishValue = (value: boolean): number => {
  //   return Number(value);
  // }


  private onInputChange = async (level: boolean) => {

    console.log('------- binary sensor', level)

    await this.setStatus(level);
  }

}
