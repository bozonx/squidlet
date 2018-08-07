import DeviceBase from '../../baseDevice/DeviceBase';
import BinarySensorParams from './BinarySensorParams';
import GpioInputFactory, {GpioInputDriver} from '../../drivers/GpioInput.driver';
import System from '../../app/System';


export default class BinarySensor extends DeviceBase {
  private readonly gpioInputDriver: GpioInputDriver;

  constructor(system: System, params: BinarySensorParams) {
    super(system, params);

    const gpioInputDriverFactory = this.system.drivers.getDriver('GpioInput.driver') as GpioInputFactory;

    this.gpioInputDriver = gpioInputDriverFactory.getInstance(this.params);
  }

  protected init = (): void => {
    this.gpioInputDriver.onChange(this.onInputChange);
  }

  protected transformParams = (params: {[index: string]: any}): BinarySensorParams => {

    // TODO: !!!!

    return {

    };
  }

  private onInputChange = () => {

  }


  // protected statusGetter = async (statusName: string): Promise<any> => {
  //   // TODO: запрашивать из binary input sensor
  //   // TODO: dead time
  // }
  //
  // protected statusSetter = async (newValue: any, statusName: string): Promise<void> => {
  //   // TODO: дергать binary input sensor
  // }

}
