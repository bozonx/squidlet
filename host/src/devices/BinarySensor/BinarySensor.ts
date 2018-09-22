import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {DigitalInputDriver, DigitalInputDriverProps} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';


interface Props extends DeviceBaseProps, DigitalInputDriverProps {
  debounce: number;
  deadTime: number;
}


export default class BinarySensor extends DeviceBase<Props> {
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    this.digitalInput.addListener(this.onInputChange);
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalInput.read() };
  }


  private onInputChange = (): void => {
    // do nothing if there is debounce or dead time
    if (this.debounceInProgress || this.deadTimeInProgress) return;

    this.debounceInProgress = true;

    // TODO: use debounce of driver

    // waiting for debounce
    setTimeout(() => {
      this.debounceInProgress = false;
      this.startValueLogic();
    }, this.props.debounce);
  }

  private async startValueLogic(): Promise<void> {
    // start dead time - ignore all the signals
    this.deadTimeInProgress = true;

    let currentLevel: boolean = false;
    const waitDeadTime = () => setTimeout(() => {
      this.deadTimeInProgress = false;
    }, this.props.deadTime);

    try {
      currentLevel = await this.digitalInput.read();
    }
    catch (err) {
      waitDeadTime();

      return;
    }

    // TODO: wait for promise ???
    this.setStatus(currentLevel);

    waitDeadTime();
  }


  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and deadTime
    return;
  }

}
