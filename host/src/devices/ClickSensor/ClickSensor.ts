import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';
import {BinaryClickDriver} from '../../drivers/Binary/BinaryClick.driver';
import {omit} from '../../helpers/lodashLike';



interface Props extends DeviceBaseProps, BinaryInputDriverProps {
  publish: 'down' | 'up' | 'state';
}


export default class ClickSensor extends DeviceBase<Props> {
  private get binaryClick(): BinaryClickDriver {
    return this.depsInstances.binaryClick as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryClick = await getDriverDep('BinaryClick.driver')
      .getInstance(omit(this.props, 'publish'));
  }

  protected didInit = async () => {
    if (this.props.publish === 'down') {
      // TODO: нужно поднять событие, но не устанавливать state
      //this.binaryClick.addStateListener(this.onClickStateChange);


    }
    else if (this.props.publish === 'up') {
      // TODO: нужно поднять событие, но не устанавливать state
      //this.binaryClick.addStateListener(this.onClickStateChange);
    }
    else if (this.props.publish === 'state') {
      this.binaryClick.addStateListener(this.onClickStateChange);
    }
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
