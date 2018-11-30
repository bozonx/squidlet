import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PCF8574Driver, ResultHandler} from '../Pcf8574/Pcf8574.driver';


interface DigitalPcf8574DriverProps extends ExpanderDriverProps {
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> implements Digital {
  // saved watchers by index
  private watchers: ResultHandler[] = [];

  private get expander(): PCF8574Driver {
    return this.depsInstances.expander as PCF8574Driver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
      .getInstance(this.props);
  }

  async setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    await this.expander.setup(pin, pinMode, outputInitialValue);

    // if (pinMode === 'output') {
    //   if (typeof outputInitialValue === 'undefined') {
    //     throw new Error(`You have to specify an outputInitialValue`);
    //   }
    //
    //   // output pin
    //   await this.expander.setupOutputPin(pin, outputInitialValue);
    // }
    // else {
    //   // input pin
    //   if (pinMode !== 'input') {
    //     this.env.log.warn(`Pcf8574 expander doesn't support setting of pullup or pulldown resistors`);
    //   }
    //
    //   await this.expander.setupInputPin(pin);
    // }
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
    return this.expander.setPinValue(pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {

    // TODO: что делать с debounce ?
    // TODO: что делать с edge ?

    const wrapper: ResultHandler = (err: Error | null, values?: boolean[]) => {
      if (err) {
        this.env.log.error(String(err));

        return;
      }
      else if (!values) {
        this.env.log.error(`DigitalPcf8574Driver.setWatch. pin: ${pin}. No values`);

        return;
      }

      handler(values[pin]);
    };

    this.expander.addListener(wrapper);

    const watcherIndex: number = this.watchers.length;
    this.watchers.push(wrapper);

    return watcherIndex;
  }

  clearWatch(id: number): void {
    // do nothing if watcher doesn't exist
    if (!this.watchers[id]) return;

    this.expander.removeListener(this.watchers[id]);
  }

  clearAllWatches(): void {
    for (let id in this.watchers) {
      this.expander.removeListener(this.watchers[id]);
    }
  }

}


export default class Factory extends DriverFactoryBase<DigitalPcf8574Driver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPcf8574Driver;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
}
