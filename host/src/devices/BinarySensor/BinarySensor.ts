import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import GpioInputFactory, {DigitalInputDriver} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import DeviceEnv from '../../app/entities/DeviceEnv';


export interface BinarySensorProps extends DeviceBaseProps {
  debounce?: number;
  deadTime?: number;
}

interface BinarySensorDrivers {
  'DigitalInput.driver': GpioInputFactory;
}


export default class BinarySensor extends DeviceBase<BinarySensorProps> {
  private readonly gpioInputDriver: DigitalInputDriver;
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  /**
   * Get driver which is dependency of device
   */
  get drivers(): BinarySensorDrivers {

    // TODO: review - может всетаки делать generic???

    return this.driversInstances as any;
  }


  protected willInit = async () => {
    //const gpioInputDriverFactory = this.system.drivers.getDriver<GpioInputFactory>('DigitalInputDriver.driver');
    this.gpioInputDriver = this.drivers['DigitalInputDriver.driver'].getInstance(this.props);
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


  validateProps(props: BinarySensorProps) {
    // TODO: !!!!
  }

}
