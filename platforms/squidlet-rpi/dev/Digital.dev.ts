import {Gpio} from 'pigpio';

import Digital, {Edge, PinMode, WatchHandler} from '../../../host/src/app/interfaces/dev/Digital';

// it supports also 'high' | 'low'
//type GpioMode = 'in' | 'out';

type GpioHanler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHanler;
}


// TODO: установить первичное значение на output пине


class DigitalDev implements Digital {
  private pinInstances: {[index: string]: Gpio} = {};
  private alertListeners: Listener[] = [];


  async setup(pin: number, pinMode: PinMode): Promise<void> {
    const convertedMode: {[index: string]: any} = this.convertMode(pinMode);
    const pinInstance = this.getPinInstance(pin);

    // TODO: set mode and resistoras
    // enableInterrupt(edge[, timeout])
    // pullUpDown(pud)

    //pinInstance.

    this.pinInstances[pin] = new Gpio(pin, {
      ...convertedMode,
    });
  }

  async read(pin: number): Promise<boolean> {
    const pinInstance = this.getPinInstance(pin);

    return Boolean(pinInstance.digitalRead());
  }

  async write(pin: number, value: boolean): Promise<void> {
    const pinInstance = this.getPinInstance(pin);
    const numValue = (value) ? 1 : 0;

    pinInstance.digitalWrite(numValue);
  }

  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    const pinInstance = this.getPinInstance(pin);
    const handlerWrapper: GpioHanler = (level: number) => {
      handler(Boolean(level));
    };

    // TODO: ??? debounce и endge сделать программно

    // register
    this.alertListeners.push({ pin, handler: handlerWrapper });
    // start listen
    pinInstance.on('alert', handlerWrapper);
    // return an index
    return this.alertListeners.length - 1;
  }

  clearWatch(id: number): void {
    const {pin, handler} = this.alertListeners[id];
    const pinInstance = this.getPinInstance(pin);

    pinInstance.off('alert', handler);
  }

  clearAllWatches(): void {
    this.alertListeners.map((item, index: number) => {
      this.clearWatch(index);
    });
  }

  private convertMode(pinMode: PinMode): {[index: string]: any} {
    switch (pinMode) {
      case ('input'):
        return {
          mode: Gpio.INPUT,
          pullUpDown: Gpio.PUD_OFF,
        };
      case ('input_pullup'):
        return {
          mode: Gpio.INPUT,
          pullUpDown: Gpio.PUD_UP,
        };
      case ('input_pulldown'):
        return {
          mode: Gpio.INPUT,
          pullUpDown: Gpio.PUD_DOWN,
        };
      case ('output'):
        return { mode: Gpio.OUTPUT };
      default:
        throw new Error(`Unknown mode "${pinMode}"`);
    }

  }

  private getPinInstance(pin: number): Gpio {
    if (!this.pinInstances[pin]) return this.pinInstances[pin];

    this.pinInstances[pin] = new Gpio(pin);

    return this.pinInstances[pin];
  }

}


export default new DigitalDev();
