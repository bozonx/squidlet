import DriverFactoryBase from 'base/DriverFactoryBase';
import DriverBase from 'base/DriverBase';
import {DigitalSubDriver, WatchHandler, DigitalInputMode} from 'interfaces/io/DigitalIo';
import {lastItem} from 'lib/arrays';

import {PortExpander} from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/PortExpander.js';


interface DigitalPortExpanderProps {
  expander: string;
}


export class DigitalPortExpander extends DriverBase<DigitalPortExpanderProps> implements DigitalSubDriver {
  // saved handlerId. Keys are handlerIndexes
  // it needs to do clearAllWatches()
  private handlerIds: number[] = [];
  private get expanderDriver(): PortExpander | undefined {
    // TODO: use system.devices
    let device: {expander?: PortExpander};

    try {
      device = this.context.system.devicesManager.getDevice(this.props.expander) as any;
    }
    catch (e) {
      return;
    }

    if (!device) return;

    return device.expander;
  }


  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void> {
    return this.callOnDevicesInit<void>(async () => {
      if (this.expanderDriver) return this.expanderDriver.setupDigitalInput(pin, inputMode, debounce, edge);

      throw new Error(this.expanderErrMsg('setupInput'));
    });
  }

  setupOutput(pin: number, initialValue: boolean): Promise<void> {
    return this.callOnDevicesInit<void>(async () => {
      if (this.expanderDriver) return this.expanderDriver.setupDigitalOutput(pin, initialValue);

      throw new Error(this.expanderErrMsg('setupOutput'));
    });
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
    return this.callOnDevicesInit<number>(async () => {
      if (this.expanderDriver) {
        const wrapper = (targetPin: number, value: boolean) => {
          if (targetPin === pin) handler(value);
        };

        const handlerId: number = await this.expanderDriver.addDigitalListener(wrapper);

        this.handlerIds.push(handlerId);

        return lastItem(this.handlerIds);
      }

      throw new Error(this.expanderErrMsg('setWatch'));
    });
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

  private callOnDevicesInit<T>(cb: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.context.onDevicesInit(async () => {
        return cb()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  private expanderErrMsg(methodWhichCheck: string): string {
    return `DigitalPortExpander.${methodWhichCheck}: It seems that it calls before Pcf8574 is initialized`;
  }

}


export default class Factory extends DriverFactoryBase<DigitalPortExpander, DigitalPortExpanderProps> {
  protected SubDriverClass = DigitalPortExpander;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    return props.expander;
  }
}
