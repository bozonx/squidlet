import System from '../../app/System';
import DeviceBase from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import GpioInputFactory, {GpioInputDriver} from '../../drivers/GpioInput.driver';
import DeviceConf from '../../app/interfaces/DeviceConf';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';


export default class BinarySensor extends DeviceBase {
  private readonly gpioInputDriver: GpioInputDriver;
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  constructor(system: System, deviceConf: DeviceConf) {
    super(system, deviceConf);

    const gpioInputDriverFactory = this.system.drivers.getDriver('GpioInput.driver') as GpioInputFactory;

    this.gpioInputDriver = gpioInputDriverFactory.getInstance(this.deviceConf.props);
  }

  protected afterInit = (): void => {
    this.gpioInputDriver.onChange(this.onInputChange);
  }

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
    }, this.deviceConf.props.debounceTime);
  }

  private async startValueLogic(): Promise<void> {
    // start dead time - ignore all the signals
    this.deadTimeInProgress = true;

    let currentLevel: BinaryLevel = false;
    const waitDeadTime = () => setTimeout(() => {
      this.deadTimeInProgress = false;
    }, this.deviceConf.props.deadTime);

    try {
      currentLevel = await this.gpioInputDriver.getLevel();
    }
    catch (err) {
      waitDeadTime();

      return;
    }

    this.setStatus(currentLevel);

    waitDeadTime();
  }

}
