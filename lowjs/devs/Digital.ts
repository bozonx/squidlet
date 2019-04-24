const gpio = require('gpio');

import DigitalDev, {
  Edge,
  DigitalPinMode,
  WatchHandler,
  DigitalInputMode
} from 'system/interfaces/io/DigitalDev';
import DebounceCall from 'system/helpers/DebounceCall';


type GpioHandler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}


export default class Digital implements DigitalDev {
  private readonly alertListeners: Listener[] = [];
  private readonly debounceCall: DebounceCall = new DebounceCall();
  // debounce times by pin number
  private debounceTimes: {[index: string]: number | undefined} = {};


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void> {
    // save debounce time
    this.debounceTimes[pin] = debounce;

    // TODO: use resistors
    gpio.pins[pin].setType(gpio.INPUT);
  }

  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupOutput(pin: number, initialValue?: boolean): Promise<void> {
    gpio.pins[pin].setType(gpio.OUTPUT);

    // set initial value if is set
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinMode(pin: number): Promise<DigitalPinMode | undefined> {

    // TODO: make it

    return;

    // const pinInstance = this.getPinInstance('getPinMode', pin);
    // const modeConst: number = pinInstance.getMode();
    //
    // if (modeConst === Gpio.INPUT) {
    //   return 'input';
    //
    //   // TODO: add support of input_pullup and input_pulldown
    // }
    // else if (modeConst === Gpio.OUTPUT) {
    //   return 'output';
    // }
    //
    // return;
  }

  async read(pin: number): Promise<boolean> {

    // TODO: что вернет ??? bool or num?

    return gpio.pins[pin].getValue();
  }

  async write(pin: number, value: boolean): Promise<void> {
    //const numValue = (value) ? 1 : 0;

    // TODO: что передать ??? bool or num?

    return gpio.pins[pin].setValue(value);
  }

  async setWatch(pin: number, handler: WatchHandler): Promise<number> {
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

    // TODO: make it

    // start listen
    //pinInstance.on('interrupt', handlerWrapper);
    // return an index
    return this.alertListeners.length - 1;
  }

  async clearWatch(id: number): Promise<void> {
    if (typeof id === 'undefined') {
      throw new Error(`You have to specify a watch id`);
    }

    // it has been removed recently
    if (!this.alertListeners[id]) return;

    const {pin, handler} = this.alertListeners[id];

    // TODO: make it

    //pinInstance.off('interrupt', handler);

    delete this.alertListeners[id];
  }

  async clearAllWatches(): Promise<void> {
    for (let index in this.alertListeners) {
      await this.clearWatch(parseInt(index));
    }
  }


  // private convertMode(pinMode: DigitalPinMode): {mode: number, pullUpDown: number} {
  //   switch (pinMode) {
  //     case ('input'):
  //       return {
  //         mode: Gpio.INPUT,
  //         pullUpDown: Gpio.PUD_OFF,
  //       };
  //     case ('input_pullup'):
  //       return {
  //         mode: Gpio.INPUT,
  //         pullUpDown: Gpio.PUD_UP,
  //       };
  //     case ('input_pulldown'):
  //       return {
  //         mode: Gpio.INPUT,
  //         pullUpDown: Gpio.PUD_DOWN,
  //       };
  //     case ('output'):
  //       return {
  //         mode: Gpio.OUTPUT,
  //         pullUpDown: Gpio.PUD_OFF,
  //       };
  //     default:
  //       throw new Error(`Unknown mode "${pinMode}"`);
  //   }
  // }

  // private resolveEdge(edge?: Edge): number {
  //   if (edge === 'rising') {
  //     return Gpio.RISING_EDGE;
  //   }
  //   else if (edge === 'falling') {
  //     return Gpio.FALLING_EDGE;
  //   }
  //
  //   return Gpio.EITHER_EDGE;
  // }

}
