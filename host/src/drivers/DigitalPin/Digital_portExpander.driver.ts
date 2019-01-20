import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalSubDriver, Edge, WatchHandler, DigitalInputMode} from '../../app/interfaces/dev/Digital';
import {PortExpanderDriver} from '../PortExpander/PortExpander.driver';
import {LENGTH_AND_START_ARR_DIFFERENCE} from '../../app/dict/constants';


interface DigitalPortExpanderDriverProps {
  expander: string;
}


export class DigitalPortExpanderDriver extends DriverBase<DigitalPortExpanderDriverProps> implements DigitalSubDriver {
  // saved handlerId. Keys are handlerIndexes
  // it needs to do clearAllWatches()
  private handlerIds: number[] = [];
  private get expanderDriver(): PortExpanderDriver | undefined {
    if (!this.env.system.devicesManager.getDevice(this.props.expander)) return;

    // TODO: use system.devices
    return (this.env.system.devicesManager.getDevice(this.props.expander) as any).expander;
  }


  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('setupInput'));

    return this.expanderDriver.setupDigitalInput(pin, inputMode, debounce, edge);
  }

  setupOutput(pin: number, initialValue: boolean): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('setupOutput'));

    return this.expanderDriver.setupDigitalOutput(pin, initialValue);
  }

  // async getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
  //   return this.expanderDriver.getDigitalPinMode(pin);
  // }

  read(pin: number): Promise<boolean> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('read'));

    return this.expanderDriver.readDigital(pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('write'));

    return this.expanderDriver.writeDigital(pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  async setWatch(pin: number, handler: WatchHandler): Promise<number> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('setWatch'));

    const wrapper = (targetPin: number, value: boolean) => {
      if (targetPin === pin) handler(value);
    };

    const handlerId: number = this.expanderDriver.addDigitalListener(wrapper);

    this.handlerIds.push(handlerId);

    return this.handlerIds.length - LENGTH_AND_START_ARR_DIFFERENCE;
  }

  async clearWatch(id: number): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('clearWatch'));

    // do nothing if watcher doesn't exist
    if (!this.handlerIds[id]) return;

    await this.expanderDriver.removeDigitalListener(this.handlerIds[id]);
  }

  async clearAllWatches(): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('clearAllWatches'));

    for (let id in this.handlerIds) {
      await this.expanderDriver.removeDigitalListener(this.handlerIds[id]);
    }
  }

  // TODO: validate expander prop - it has to be existent device in master config

  private expanderErrMsg(methodWhichCheck: string): string {
    return `DigitalPortExpanderDriver.${methodWhichCheck}: It seems that it calls before Pcf8574 is initialized`;
  }

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
