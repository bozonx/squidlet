import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';
import {BinaryClickDriver} from '../../drivers/Binary/BinaryClick.driver';



interface Props extends DeviceBaseProps, BinaryInputDriverProps {
}


export default class ClickSensor extends DeviceBase<Props> {
  private get binaryClick(): BinaryClickDriver {
    return this.depsInstances.binaryClick as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryClick = await getDriverDep('BinaryClick.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryClick.addStateListener(this.onClickStateChange);

    // TODO: в props задается какое событие слушать
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: this.binaryClick.isDown() };
  }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }


  // onDown(cb: Handler): void {
  //   this.downEvents.addListener(cb);
  // }
  //
  // onUp(): void {
  //   this.upEvents.addListener(cb);
  // }


  private onClickStateChange = async (level: boolean) => {
    await this.setStatus(true);
  }

}
