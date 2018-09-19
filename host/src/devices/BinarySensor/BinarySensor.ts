import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {DigitalInputDriver} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import DriverFactory from '../../app/interfaces/DriverFactory';


interface Props extends DeviceBaseProps {
  debounce?: number;
  deadTime?: number;
}

interface DepsDrivers {
  'DigitalInput.driver': DriverFactory<DigitalInputDriver>;
}


export default class BinarySensor extends DeviceBase<Props> {
  private digitalInputDriver?: DigitalInputDriver;
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  /**
   * Get driver which is dependency of device
   */
  protected get drivers(): DepsDrivers {
    return this.driversInstances as DepsDrivers;
  }


  protected willInit = async () => {
    this.digitalInputDriver = this.drivers['DigitalInput.driver'].getInstance(this.props);

    // this.digitalInputDriver = this.getDriverDep<DriverFactory<DigitalInputDriver>>(
    //   'DigitalInputDriver.driver'
    // ).getInstance(this.props);
  }

  protected didInit = async () => {
    this.gpioInputDriver.onChange(this.onInputChange);
  };

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.gpioInputDriver.getLevel() };
  }


  private onInputChange = (): void => {
    // do nothing if there is debounce or dead time
    if (this.debounceInProgress || this.deadTimeInProgress) return;

    this.debounceInProgress = true;

    // waiting for debounce
    setTimeout(() => {
      this.debounceInProgress = false;
      this.startValueLogic();
    }, this.props.debounceTime);
  }

  private async startValueLogic(): Promise<void> {
    // start dead time - ignore all the signals
    this.deadTimeInProgress = true;

    let currentLevel: BinaryLevel = false;
    const waitDeadTime = () => setTimeout(() => {
      this.deadTimeInProgress = false;
    }, this.props.deadTime);

    try {
      currentLevel = await this.gpioInputDriver.getLevel();
    }
    catch (err) {
      waitDeadTime();

      return;
    }

    // TODO: wait for promise ???
    this.setStatus(currentLevel);

    waitDeadTime();
  }


  validateProps(props: Props) {
    // TODO: !!!!
  }

}
