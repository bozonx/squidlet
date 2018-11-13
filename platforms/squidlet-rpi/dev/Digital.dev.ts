import {Gpio} from 'pigpio';

import Digital, {Edge, PinMode, WatchHandler} from '../../../host/src/app/interfaces/dev/Digital';


type GpioHanler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHanler;
}


// TODO: установить первичное значение на output пине
// TODO: проверить getPinMode и что вернет если пин не сконфигурирован


export default class DigitalDev implements Digital {
  private readonly pinInstances: {[index: string]: Gpio} = {};
  private readonly alertListeners: Listener[] = [];
  private debounceTimeouts: {[index: string]: any} = {};


  async setup(pin: number, pinMode: PinMode): Promise<void> {
    const convertedMode: {[index: string]: any} = this.convertMode(pinMode);

    this.pinInstances[pin] = new Gpio(pin, {
      ...convertedMode,
      // listen both and skip unnecessary in setWatch
      edge: (convertedMode.mode === Gpio.INPUT) ? Gpio.EITHER_EDGE : undefined,
    });
  }

  getPinMode(pin: number): PinMode | undefined {
    const pinInstance = this.getPinInstance(pin);

    const modeConst: number = pinInstance.getMode();

    if (modeConst === Gpio.INPUT) {
      return 'input';

      // TODO: add support of input_pullup and input_pulldown
    }
    else if (modeConst === Gpio.OUTPUT) {
      return 'output';
    }

    return;
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
      if (!debounce) {
        handler(Boolean(level));
      }
      else {
        // wait for debounce and read current level
        this.debounceCall( async () => {
          const realLevel = await this.read(pin);
          handler(realLevel);
        }, pin, debounce);
      }
    };

    // TODO: edge сделать программно

    // register
    this.alertListeners.push({ pin, handler: handlerWrapper });
    // start listen
    pinInstance.on('interrupt', handlerWrapper);
    // return an index
    return this.alertListeners.length - 1;
  }

  clearWatch(id: number): void {
    if (typeof id === 'undefined') {
      throw new Error(`You have to specify a watch id`);
    }

    const {pin, handler} = this.alertListeners[id];
    const pinInstance = this.getPinInstance(pin);

    pinInstance.off('interrupt', handler);
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
        return {
          mode: Gpio.OUTPUT,
          pullUpDown: Gpio.PUD_OFF,
        };
      default:
        throw new Error(`Unknown mode "${pinMode}"`);
    }

  }

  private getPinInstance(pin: number): Gpio {
    if (!this.pinInstances[pin]) {
      throw new Error(`You have to do setup of pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

  private debounceCall(cb: () => void, pin: number, debounce?: number) {
    // if there isn't debounce - call immediately
    if (!debounce) return cb();

    // if debounce is in progress - do nothing
    if (typeof this.debounceTimeouts[pin] !== 'undefined') return;

    // making new debounce timeout
    const wrapper = () => {
      delete this.debounceTimeouts[pin];
      cb();
    };

    this.debounceTimeouts[pin] = setTimeout(wrapper, debounce);
  }

}
