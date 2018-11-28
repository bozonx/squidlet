import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PCF8574Driver} from '../Pcf8574/Pcf8574.driver';


interface DigitalPcf8574DriverProps extends ExpanderDriverProps {
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> implements Digital {
  private get expander(): PCF8574Driver {
    return this.depsInstances.expander as PCF8574Driver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
      .getInstance(this.props);
  }

  async setup(pin: number, pinMode: PinMode): Promise<void> {
    if (pinMode === 'output') {
      // output pin
      await this.expander.outputPin(pin, false);
    }
    else {
      // input pin
      if (pinMode !== 'input') {
        this.env.log.warn(`Pcf8574 expander doesn't support setting of pullup or pulldown resistors`);
      }

      await this.expander.inputPin(pin, false);
    }
  }

  getPinMode(pin: number): PinMode | undefined {
    return this.expander.getPinMode(pin);
  }

  async read(pin: number): Promise<boolean> {
    return this.expander.getPinValue(pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    return this.expander.setPin(pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    // TODO: если пин сконфигурирован на output - ругаться

    // TODO: !!!

    return 0;
  }

  clearWatch(id: number): void {
    // TODO: !!!
  }

  clearAllWatches(): void {
    // TODO: !!!
  }

}


export default class Factory extends DriverFactoryBase<DigitalPcf8574Driver> {
  protected DriverClass = DigitalPcf8574Driver;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(instanceProps: {[index: string]: any}): string {
    const bus: string = (instanceProps.bus) ? String(instanceProps.bus) : 'default';

    return `${bus}-${instanceProps.address}`;
  }
}
