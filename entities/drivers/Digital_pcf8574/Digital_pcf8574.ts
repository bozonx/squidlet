import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import {DigitalSubDriver, Edge, WatchHandler, DigitalInputMode} from 'system/interfaces/io/DigitalDev';
import {LENGTH_AND_START_ARR_DIFFERENCE} from 'system/dict/constants';

import {Pcf8574ExpanderProps, Pcf8574} from '../Pcf8574/Pcf8574';


interface DigitalPcf8574Props extends Pcf8574ExpanderProps {
  expander: string;
}


export class DigitalPcf8574 extends DriverBase<DigitalPcf8574Props> implements DigitalSubDriver {
  // saved handlerId. Keys are handlerIndexes
  // it needs to do clearAllWatches()
  private handlerIds: number[] = [];
  private get expanderDriver(): Pcf8574 | undefined {
    if (!this.env.system.devicesManager.getDevice(this.props.expander)) return;

    // TODO: use system.devices
    return (this.env.system.devicesManager.getDevice(this.props.expander) as any).expander;
  }


  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void> {
    return this.callOnDevicesInit<void>(async () => {
      if (this.expanderDriver) return this.expanderDriver.setupInput(pin, debounce, edge);

      throw new Error(this.expanderErrMsg('setupInput'));
    });
  }

  setupOutput(pin: number, initialValue: boolean): Promise<void> {
    return this.callOnDevicesInit<void>(async () => {
      if (this.expanderDriver) return this.expanderDriver.setupOutput(pin, initialValue);

      throw new Error(this.expanderErrMsg('setupOutput'));
    });
  }

  // getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
  //   return this.expanderDriver.getPinMode(pin);
  // }

  read(pin: number): Promise<boolean> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('read'));

    return this.expanderDriver.read(pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('write'));

    return this.expanderDriver.write(pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  async setWatch(pin: number, handler: WatchHandler): Promise<number> {
    return this.callOnDevicesInit<number>(async () => {
      if (this.expanderDriver) {
        const wrapper = (targetPin: number, value: boolean) => {
          if (targetPin === pin) handler(value);
        };

        const handlerId: number = await this.expanderDriver.addListener(wrapper);

        this.handlerIds.push(handlerId);

        return this.handlerIds.length - LENGTH_AND_START_ARR_DIFFERENCE;
      }

      throw new Error(this.expanderErrMsg('setWatch'));
    });
  }

  async clearWatch(id: number): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('clearWatch'));

    // do nothing if watcher doesn't exist
    if (!this.handlerIds[id]) return;

    await this.expanderDriver.removeListener(this.handlerIds[id]);
  }

  async clearAllWatches(): Promise<void> {
    if (!this.expanderDriver) throw new Error(this.expanderErrMsg('clearAllWatches'));

    for (let id in this.handlerIds) {
      await this.expanderDriver.removeListener(this.handlerIds[id]);
    }
  }

  // TODO: validate expander prop - it has to be existent device in master config

  private callOnDevicesInit<T>(cb: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.env.system.onDevicesInit(() => {
        cb()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  private expanderErrMsg(methodWhichCheck: string): string {
    return `DigitalPcf8574.${methodWhichCheck}: It seems that it calls before Pcf8574 is initialized`;
  }

}


export default class Factory extends DriverFactoryBase<DigitalPcf8574> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPcf8574;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    return props.expander;
  }
}
