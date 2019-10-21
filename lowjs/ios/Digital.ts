import {callPromised} from '../../system/lib/common';

const gpio = require('gpio');

import DigitalIo from 'system/interfaces/io/DigitalIo';
import DebounceCall from 'system/lib/debounceCall/DebounceCall';


type GpioHandler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}


export default class Digital implements DigitalIo {
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

    // TODO: check it
    gpio.pins[pin].setType(this.convertInputMode(inputMode));
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
    if (!gpio.pins[pin]) {
      throw new Error(`Lowjs Digital io getPinMode: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    const pinType: number = gpio.pins[pin].getType();

    // TODO: check it

    if (pinType === gpio.INPUT) {
      return 'input';
    }
    else if (pinType === gpio.INPUT_PULLUP) {
      return 'input_pullup';
    }
    else if (pinType === gpio.INPUT_PULLDOWN) {
      return 'input_pulldown';
    }
    else if (pinType === gpio.OUTPUT) {
      return 'output';
    }
    else if (pinType === gpio.OUTPUT_OPENDRAIN) {
      return 'output';
    }
    // TODO: what is OUTPUT_OPENDRAIN

    return;
  }

  async read(pin: number): Promise<boolean> {
    const result: number = await callPromised(gpio.pins[pin].getValue);

    return Boolean(result);
  }

  async write(pin: number, value: boolean): Promise<void> {
    const numValue = (value) ? 1 : 0;

    // TODO: почему не асинхронно???
    return gpio.pins[pin].setValue(numValue);
  }

  async setWatch(pin: number, handler: WatchHandler): Promise<number> {

    // TODO: review

    const handlerWrapper: GpioHandler = (level: number) => {
      const value: boolean = Boolean(level);

      // if undefined or 0 - call handler immediately
      if (!this.debounceTimes[pin]) {
        handler(value);
      }
      else {
        // wait for debounce and read current level
        this.debounceCall.invoke(async () => {
          const realLevel = await this.read(pin);

          handler(realLevel);
        }, this.debounceTimes[pin], pin);
      }
    };

    // register
    this.alertListeners.push({ pin, handler: handlerWrapper });

    // TODO: учитывать edge
    // start listen
    gpio.pins[pin].on('fall', () => handlerWrapper(0));
    gpio.pins[pin].on('rise', () => handlerWrapper(1));

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

    // TODO: check it

    gpio.pins[pin].off('fall', handler);
    gpio.pins[pin].off('rise', handler);

    delete this.alertListeners[id];
  }

  async clearAllWatches(): Promise<void> {
    for (let index in this.alertListeners) {
      await this.clearWatch(parseInt(index));
    }
  }


  private convertInputMode(inputMode: DigitalInputMode): number {
    switch (inputMode) {
      case 'input':
        return gpio.INPUT;
      case 'input_pullup':
        return gpio.INPUT_PULLUP;
      case 'input_pulldown':
        return gpio.INPUT_PULLDOWN;
    }
  }

}
