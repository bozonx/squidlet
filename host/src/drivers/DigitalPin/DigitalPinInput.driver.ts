import {Edge, WatchHandler, DigitalSubDriver, DigitalInputMode} from '../../app/interfaces/dev/Digital';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {resolveDriverName} from './digitalHelpers';
import {omit} from '../../helpers/lodashLike';
import IndexedEvents from '../../helpers/IndexedEvents';


export interface DigitalPinInputDriverProps extends DigitalBaseProps {
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
export class DigitalPinInputDriver extends DriverBase<DigitalPinInputDriverProps> {
  private changeEvents = new IndexedEvents<WatchHandler>();

  private get source(): DigitalSubDriver {
    return this.depsInstances.source as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.source);

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
        this.env.system.log.error(
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


  private handleChange(state: boolean): void {

    // TODO: double check

    this.changeEvents.emit(state);
  }

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


export default class Factory extends DriverFactoryBase<DigitalPinInputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPinInputDriver;
  // TODO: source + pin + спросить адрес у нижележащего драйвера
}
