import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalSubDriver, Edge, DigitalPinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {ExpanderDriverProps, PCF8574Driver} from '../Pcf8574/Pcf8574.driver';
import {LENGTH_AND_START_ARR_DIFFERENCE} from '../../app/dict/constants';
import DebounceCall from '../../helpers/DebounceCall';


interface DigitalPcf8574DriverProps extends ExpanderDriverProps {
  expander: string;
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> implements DigitalSubDriver {
  // saved handlerId. Keys are handlerIndexes
  // it needs to do clearAllWatches()
  private handlerIds: number[] = [];
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private get expanderDriver(): PCF8574Driver {
    // TODO: use system.devices
    return (this.env.system.devicesManager.getDevice(this.props.expander) as any).expander;
  }


  setup(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    return this.expanderDriver.setup(pin, pinMode, outputInitialValue);
  }

  getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
    return this.expanderDriver.getPinMode(pin);
  }

  read(pin: number): Promise<boolean> {
    return this.expanderDriver.read(pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    return this.expanderDriver.write(pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
    const wrapper = (values: boolean[]) => {
      const pinValue: boolean = values[pin];

      // skip not suitable edge
      if (edge === 'rising' && !pinValue) {
        return;
      }
      else if (edge === 'falling' && pinValue) {
        return;
      }

      if (!debounce) {
        handler(pinValue);
      }
      else {
        // wait for debounce and read current level
        this.debounceCall.invoke( pin, debounce, async () => {
          const realLevel = await this.read(pin);
          handler(realLevel);
        });
      }
    };

    const handlerId: number = await this.expanderDriver.addListener(wrapper);

    this.handlerIds.push(handlerId);

    return this.handlerIds.length - LENGTH_AND_START_ARR_DIFFERENCE;
  }

  async clearWatch(id: number): Promise<void> {
    // do nothing if watcher doesn't exist
    if (!this.handlerIds[id]) return;

    await this.expanderDriver.removeListener(this.handlerIds[id]);
  }

  async clearAllWatches(): Promise<void> {
    for (let id in this.handlerIds) {
      await this.expanderDriver.removeListener(this.handlerIds[id]);
    }
  }

  // TODO: validate expander prop - it has to be existent device in master config

}


export default class Factory extends DriverFactoryBase<DigitalPcf8574Driver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPcf8574Driver;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    return props.expander;
  }
}
