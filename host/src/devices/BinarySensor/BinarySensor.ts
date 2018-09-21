import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {DigitalInputDriver} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import DriverInstance from '../../app/interfaces/DriverInstance';


// TODO: наследовать ещё digital base props
interface Props extends DeviceBaseProps {
  debounce: number;
  deadTime: number;
}


export default class BinarySensor extends DeviceBase<Props> {
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }


  protected willInit = async (getDriverDep: (driverName: string) => DriverInstance) => {
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    this.digitalInput.onChange(this.onInputChange);
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalInput.getLevel() };
  }


  private onInputChange = (): void => {
    // do nothing if there is debounce or dead time
    if (this.debounceInProgress || this.deadTimeInProgress) return;

    this.debounceInProgress = true;

    // waiting for debounce
    setTimeout(() => {
      this.debounceInProgress = false;
      this.startValueLogic();
    }, this.props.debounce);
  }

  private async startValueLogic(): Promise<void> {
    // start dead time - ignore all the signals
    this.deadTimeInProgress = true;

    let currentLevel: BinaryLevel = false;
    const waitDeadTime = () => setTimeout(() => {
      this.deadTimeInProgress = false;
    }, this.props.deadTime);

    try {
      currentLevel = await this.digitalInput.getLevel();
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
