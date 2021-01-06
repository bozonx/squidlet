import DeviceBase from '__old/system/base/DeviceBase';
import {Dictionary} from 'src/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';

import {ImpulseInput, ImpulseInputProps} from '../../drivers/ImpulseInput/ImpulseInput';


interface Props extends ImpulseInputProps {
}


export default class MotionSensor extends DeviceBase<Props> {
  private get impulseInput(): ImpulseInput {
    return this.depsInstances.impulseInput;
  }


  protected async didInit() {
    this.depsInstances.impulseInput = await this.context.getSubDriver('ImpulseInput', this.props);
    // listen driver's change
    this.impulseInput.onChange(this.onInputChange);
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    // TODO: нужно ли тут делать read ???? делается до инициализации gpio
    return { [DEFAULT_DEVICE_STATUS]: await this.impulseInput.isInProgress() };
  }


  private onInputChange = async (level: boolean) => {
    await this.setStatus(level);
  }

}
