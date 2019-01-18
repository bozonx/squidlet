import {Gpio} from 'pigpio';

import {
  Digital,
  Edge,
  DigitalPinMode,
  WatchHandler,
  DigitalInputMode
} from '../../../host/src/app/interfaces/dev/Digital';
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
  // debounce times by pin number
  private debounceTimes: {[index: string]: number | undefined} = {};


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void> {
    const convertedMode: {mode: number, pullUpDown: number} = this.convertMode(inputMode);
    // save debounce time
    this.debounceTimes[pin] = debounce;
    // make a new instance of Gpio
    this.pinInstances[pin] = new Gpio(pin, {
      ...convertedMode,
      edge: this.resolveEdge(edge),
    });
  }

  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupOutput(pin: number, outputInitialValue?: boolean): Promise<void> {
    const convertedMode: {mode: number, pullUpDown: number} = this.convertMode('output');

    this.pinInstances[pin] = new Gpio(pin, {
      ...convertedMode,
    });

    // set initial value
    if (typeof outputInitialValue !== 'undefined') {
      //throw new Error(`You have to specify an outputInitialValue`);
      await this.write(pin, outputInitialValue);
    }
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
    const pinInstance = this.getPinInstance('getPinMode', pin);
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
    const pinInstance = this.getPinInstance('read', pin);

    return Boolean(pinInstance.digitalRead());
  }

  async write(pin: number, value: boolean): Promise<void> {
    const pinInstance = this.getPinInstance('write', pin);
    const numValue = (value) ? 1 : 0;

    pinInstance.digitalWrite(numValue);
  }

  async setWatch(pin: number, handler: WatchHandler): Promise<number> {

    // TODO: review
    // TODO: remove
    //if (!this.pinInstances[pin]) return 0;

    const pinInstance = this.getPinInstance('setWatch', pin);
    const handlerWrapper: GpioHandler = (level: number) => {
      const value: boolean = Boolean(level);

      // if undefined or 0 - call handler immediately
      if (!this.debounceTimes[pin]) {
        handler(value);
      }
      else {
        // wait for debounce and read current level
        this.debounceCall.invoke(pin, this.debounceTimes[pin], async () => {
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
    const pinInstance = this.getPinInstance('clearWatch', pin);

    pinInstance.off('interrupt', handler);
  }

  async clearAllWatches(): Promise<void> {
    for (let index in this.alertListeners) {
      await this.clearWatch(parseInt(index));
    }
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

  private resolveEdge(edge?: Edge): number {
    if (edge === 'rising') {
      return Gpio.RISING_EDGE;
    }
    else if (edge === 'falling') {
      return Gpio.FALLING_EDGE;
    }

    return Gpio.EITHER_EDGE;
  }

  private getPinInstance(methodWhichAsk: string, pin: number): Gpio {
    if (!this.pinInstances[pin]) {
      throw new Error(`DigitalDev.${methodWhichAsk}: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

}
