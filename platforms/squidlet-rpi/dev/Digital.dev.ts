import {Gpio} from 'pigpio';

import Digital, {Edge, DigitalPinMode, WatchHandler} from '../../../host/src/app/interfaces/dev/Digital';
import DebounceCall from '../../../host/src/helpers/DebounceCall';


type GpioHandler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}


export default class DigitalDev implements Digital {
  private readonly pinInstances: {[index: string]: Gpio} = {};
  private readonly alertListeners: Listener[] = [];
  private readonly debounceCall: DebounceCall = new DebounceCall();


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setup(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    const convertedMode: {mode: number, pullUpDown: number} = this.convertMode(pinMode);

    this.pinInstances[pin] = new Gpio(pin, {
      ...convertedMode,
      // listen both and skip unnecessary in setWatch
      edge: (convertedMode.mode === Gpio.INPUT) ? Gpio.EITHER_EDGE : undefined,
    });

    // set initial value for output pin
    if (pinMode === 'output') {
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      await this.write(pin, outputInitialValue);
    }
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
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

  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
    const pinInstance = this.getPinInstance(pin);
    const handlerWrapper: GpioHandler = (level: number) => {
      const value: boolean = Boolean(level);

      if (!this.isCorrectEdge(value, edge)) return;

      if (!debounce) {
        handler(value);
      }
      else {
        // wait for debounce and read current level
        this.debounceCall.invoke(pin, debounce, async () => {
          const realLevel = await this.read(pin);
          handler(realLevel);
        });
      }
    };

    // register
    this.alertListeners.push({ pin, handler: handlerWrapper });
    // start listen
    pinInstance.on('interrupt', handlerWrapper);
    // return an index
    return this.alertListeners.length - 1;
  }

  async clearWatch(id: number): Promise<void> {
    if (typeof id === 'undefined') {
      throw new Error(`You have to specify a watch id`);
    }

    const {pin, handler} = this.alertListeners[id];
    const pinInstance = this.getPinInstance(pin);

    pinInstance.off('interrupt', handler);
  }

  async clearAllWatches(): Promise<void> {
    this.alertListeners.map((item, index: number) => {
      this.clearWatch(index);
    });
  }

  private convertMode(pinMode: DigitalPinMode): {mode: number, pullUpDown: number} {
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
      throw new Error(`You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

  private isCorrectEdge(value: boolean, edge?: Edge): boolean {
    if (!edge || edge === 'both') return true;
    else if (value && edge === 'rising') return true;
    else if (!value && edge === 'falling') return true;

    return false;
  }

}
