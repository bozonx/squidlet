import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';


interface Props extends DeviceBaseProps, BinaryInputDriverProps {
  impulseLength?: number;
}


export default class BinaryImpulse extends DeviceBase<Props> {
  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as BinaryInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);
  }


  protected statusGetter = async (): Promise<Data> => {

    // TODO: review - может использовать локальный статус ???

    return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }

  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and blockTime
    return;
  }


  private onInputChange = async (level: boolean) => {
    await this.setStatus(level);
  }

}
