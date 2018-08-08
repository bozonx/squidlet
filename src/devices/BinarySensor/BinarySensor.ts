import System from '../../app/System';
import DeviceBase from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import GpioInputFactory, {GpioInputDriver} from '../../drivers/GpioInput.driver';


export default class BinarySensor extends DeviceBase {
  private readonly gpioInputDriver: GpioInputDriver;
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  constructor(system: System, params: {[index: string]: any}) {
    super(system, params);

    const gpioInputDriverFactory = this.system.drivers.getDriver('GpioInput.driver') as GpioInputFactory;

    this.gpioInputDriver = gpioInputDriverFactory.getInstance(this.params);
  }

  protected init = (): void => {
    this.gpioInputDriver.onChange(this.onInputChange);
  }

  protected statusGetter = async (): Promise<{[index: string]: BinaryLevel}> => {
    return { 'default': await this.gpioInputDriver.getLevel() };
  }

  // TODO: this.params должны быть BinarySensorParams
  // TODO: add validation
  // TODO: make publish
  // TODO: set topic to status manager

  private onInputChange = (): void => {
    // do nothing if there is debounce or dead time
    if (this.debounceInProgress || this.deadTimeInProgress) return;

    this.debounceInProgress = true;

    // waiting for debounce
    setTimeout(async () => {
      this.debounceInProgress = false;
      await this.startValueLogic();
    }, this.params.debounceTime);
  }

  private async startValueLogic(): Promise<void> {
    // start dead time - ignore all the signals
    this.deadTimeInProgress = true;

    let currentLevel: BinaryLevel = 0;

    try {
      currentLevel = await this.gpioInputDriver.getLevel();
    }
    catch (err) {
      setTimeout(() => this.deadTimeInProgress = false, this.params.deadTime);

      return;
    }

    await this.status.setStatus(currentLevel);
    setTimeout(() => this.deadTimeInProgress = false, this.params.deadTime);
  }

}
