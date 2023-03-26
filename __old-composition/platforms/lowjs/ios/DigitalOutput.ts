import {callPromised} from '../../../../../squidlet-lib/src/common';

const gpio = require('gpio');

import DigitalInputIo from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo.js';
import DebounceCall from '../../../../../squidlet-lib/src/debounceCall/DebounceCall';
import DigitalOutput from '../../../../../squidlet-networking/src/io/nodejs/ios/DigitalOutput';
import DigitalOutputIo from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalOutputIo.js';


type GpioHandler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}


export default class DigitalOutput implements DigitalOutputIo {
  private readonly alertListeners: Listener[] = [];
  private readonly debounceCall: DebounceCall = new DebounceCall();
  // debounce times by pin number
  private debounceTimes: {[index: string]: number | undefined} = {};


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setup(pin: number, initialValue?: boolean): Promise<void> {
    gpio.pins[pin].setType(gpio.OUTPUT);

    // set initial value if is set
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  // /**
  //  * Get pin mode.
  //  * It throws an error if pin hasn't configured before
  //  */
  // async getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
  //   if (!gpio.pins[pin]) {
  //     throw new Error(`Lowjs Digital io getPinMode: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
  //   }
  //
  //   const pinType: number = gpio.pins[pin].getType();
  //
  //   // TODO: check it
  //
  //   if (pinType === gpio.INPUT) {
  //     return 'input';
  //   }
  //   else if (pinType === gpio.INPUT_PULLUP) {
  //     return 'input_pullup';
  //   }
  //   else if (pinType === gpio.INPUT_PULLDOWN) {
  //     return 'input_pulldown';
  //   }
  //   else if (pinType === gpio.OUTPUT) {
  //     return 'output';
  //   }
  //   else if (pinType === gpio.OUTPUT_OPENDRAIN) {
  //     return 'output';
  //   }
  //   // TODO: what is OUTPUT_OPENDRAIN
  //
  //   return;
  // }


  async write(pin: number, value: boolean): Promise<void> {
    const numValue = (value) ? 1 : 0;

    // TODO: почему не асинхронно???
    return gpio.pins[pin].setValue(numValue);
  }

}
