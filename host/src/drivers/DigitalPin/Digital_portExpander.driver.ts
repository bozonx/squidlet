import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {ExpanderDriverProps} from '../Pcf8574/Pcf8574.driver';
import {DigitalPinHandler, PortExpanderDriver, PortExpanderPinMode} from '../PortExpander/PortExpander.driver';
import {LENGTH_AND_START_ARR_DIFFERENCE} from '../../app/dict/constants';


interface DigitalPortExpanderDriverProps extends ExpanderDriverProps {
  expander: string;
}


export class DigitalPortExpanderDriver extends DriverBase<DigitalPortExpanderDriverProps> implements Digital {
  // saved handlerId. Keys are handlerIndexes
  // it needs to do clearAllWatches()
  private handlerIds: string[] = [];

  get expanderDriver(): PortExpanderDriver {
    return (this.env.system.devicesManager.getDevice(this.props.expander) as any).expander;
  }


  setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    return this.expanderDriver.setupDigital(pin, pinMode, outputInitialValue);
  }

  async getPinMode(pin: number): Promise<PinMode | undefined> {
    const expanderPinMode: PortExpanderPinMode | undefined = await this.expanderDriver.getPinMode(pin);

    if (expanderPinMode === 'input'
      || expanderPinMode === 'input_pullup'
      || expanderPinMode === 'input_pulldown'
      || expanderPinMode === 'output'
    ) return expanderPinMode as PinMode;

    return;
  }

  read(pin: number): Promise<boolean> {
    return this.expanderDriver.readDigital(pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    return this.expanderDriver.writeDigital(pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
    const wrapper: DigitalPinHandler = (targetPin: number, value: boolean) => {
      if (targetPin !== pin) return;

      handler(value);
    };

    const handlerId: string = this.expanderDriver.addDigitalListener(wrapper);

    this.handlerIds.push(handlerId);

    return this.handlerIds.length - LENGTH_AND_START_ARR_DIFFERENCE;
  }

  async clearWatch(id: number): Promise<void> {
    // do nothing if watcher doesn't exist
    if (!this.handlerIds[id]) return;

    await this.env.system.devices.removeListener(this.handlerIds[id]);
  }

  async clearAllWatches(): Promise<void> {
    for (let id in this.handlerIds) {
      await this.env.system.devices.removeListener(this.handlerIds[id]);
    }
  }

  // TODO: validate expander prop - it has to be existent device in master config

}


export default class Factory extends DriverFactoryBase<DigitalPortExpanderDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPortExpanderDriver;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    return props.expander;
  }
}
