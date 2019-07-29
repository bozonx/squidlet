import {Edge, WatchHandler, DigitalSubDriver, DigitalInputMode} from 'system/interfaces/io/DigitalIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {omit} from 'system/lib/lodashLike';
import IndexedEvents from 'system/lib/IndexedEvents';

import DigitalBaseProps from '../DigitalPinOutput/interfaces/DigitalBaseProps';


export interface DigitalPinInputProps extends DigitalBaseProps {
  // debounce time in ms only for input pins. If not set system defaults will be used.
  edge: Edge;
  // Listen to low, high or both levels. By default is both.
  debounce: number;
  // additional check value after debounce
  doubleCheck: boolean;
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
}


/**
 * This is middleware driver which allows acting with low level drivers as an input pin.
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinInput extends DriverBase<DigitalPinInputProps> {
  private changeEvents = new IndexedEvents<WatchHandler>();
  private doubleCheckInProgress: boolean = false;
  private lastValue?: boolean;
  private secondCheckTimeout: number = 0;

  private get source(): DigitalSubDriver {
    return this.depsInstances.source;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    // the second check is half of a debounce time
    this.secondCheckTimeout = Math.ceil((this.props.debounce || 0) / 2);

    const driverName = `Digital_${this.props.source}`;

    this.depsInstances.source = await getDriverDep(driverName)
      .getInstance(omit(
        this.props,
        'doubleCheck',
        'pullup',
        'pulldown',
        'pin',
        'source'
      ));
  }

  protected didInit = async () => {
    // setup pin as an input with resistor if specified
    await this.source.setupInput(this.props.pin, this.resolvePinMode(), this.props.debounce, this.props.edge)
      .catch((err) => {
        this.env.log.error(
          `DigitalPinInputDriver: Can't setup pin. ` +
          `"${JSON.stringify(this.props)}": ${err.toString()}`
        );
      });

    await this.source.setWatch(this.props.pin, this.handleChange);
  }


  async getPinMode(): Promise<DigitalInputMode> {
    return this.resolvePinMode();
  }

  /**
   * Get current binary value of pin.
   */
  read(): Promise<boolean> {
    return this.source.read(this.props.pin);
  }

  /**
   * Listen to interruption of pin.
   */
  async addListener(handler: WatchHandler): Promise<number> {
    //return this.source.setWatch(this.props.pin, handler);
    return this.changeEvents.addListener(handler);
  }

  async listenOnce(handler: WatchHandler): Promise<number> {
    return this.changeEvents.once(handler);

    // let handlerId: number;
    // const wrapper: WatchHandler = async (level: boolean) => {
    //   // remove listener and don't listen any more
    //   await this.removeListener(handlerId);
    //
    //   handler(level);
    // };
    //
    // handlerId = await this.source.setWatch(this.props.pin, wrapper);
    //
    // return handlerId;
  }

  async removeListener(handlerIndex: number): Promise<void> {
    //return this.source.clearWatch(handlerIndex);
    this.changeEvents.removeListener(handlerIndex);
  }


  private handleChange = (state: boolean): void => {
    // skip events if double check is waiting
    if (this.doubleCheckInProgress) return;
    // if doubleCheck isn't set up - just rise an event
    else if (!this.props.doubleCheck) return this.changeEvents.emit(state);
    // if new state isn't changed - just emit event and do not do a check
    else if (this.lastValue === state) return this.changeEvents.emit(state);

    this.doSecondCheck(state);
  }

  private doSecondCheck(newState: boolean) {
    this.doubleCheckInProgress = true;

    setTimeout(async () => {
      this.doubleCheckInProgress = false;

      // !newState && secondValue = true
      // newState && secondValue = true
      // !newState && !secondValue = false
      // newState && !secondValue = false
      const secondValue: boolean = await this.read();

      //const result: boolean = this.resolveDoubleCheckValue(newState, secondValue);

      this.lastValue = newState;
      this.changeEvents.emit(secondValue);
      //this.changeEvents.emit(result);
    }, this.secondCheckTimeout);
  }

  // private resolveDoubleCheckValue(newState: boolean, secondCheckState: boolean): boolean {
  //   if (newState && secondCheckState) return true;
  //   else if (!newState && secondCheckState) return true;
  //
  //   // !newState && !secondCheckState = false
  //   // newState && !secondCheckState = false
  //   return false;
  // }

  private resolvePinMode(): DigitalInputMode {
    if (this.props.pullup) return 'input_pullup';
    else if (this.props.pulldown) return 'input_pulldown';
    else return 'input';
  }


  protected validateProps = (): string | undefined => {
    // TODO: validate params, specific for certain driver params, только pullup или pulldown может быть установлен
    return;
  }

}


export default class Factory extends DriverFactoryBase<DigitalPinInput> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPinInput;
  // TODO: source + pin + спросить адрес у нижележащего драйвера
}
