/*
 * It uses a pigpiod daemon.
 *
 * Control pigpiod:
 *
 * Run in foreground
 *     sudo pigpiod -g
 *
 * start a daemon
 *     sudo pigpiod
 *
 * stop a daemon
 *     sudo killall pigpiod
 */

import DigitalIo, {ChangeHandler} from '../../system/interfaces/io/DigitalIo';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../../system/interfaces/gpioTypes';
import ThrottleCall from '../../system/lib/debounceCall/ThrottleCall';
import DebounceCall from '../../system/lib/debounceCall/DebounceCall';
import {callPromised} from '../../system/lib/common';
import IndexedEventEmitter from '../../system/lib/IndexedEventEmitter';
import {Gpio} from 'pigpio';


const pigpio = require('pigpio-client').pigpio({
  //host: '0.0.0.0'
  //timeout: 1,
});

// import DigitalIo, {
//   Edge,
//   DigitalPinMode,
//   WatchHandler,
//   DigitalInputMode
// } from '../../system/interfaces/io/DigitalIo';
// import DebounceCall from '../../system/helpers/DebounceCall';
// import {callPromised} from '../../system/helpers/helpers';


type GpioHandler = (level: number, tick: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}

const CONNECTION_TIMEOUT = 60000;
let wasConnected = false;
const connectionPromise = new Promise((resolve, reject) => {
  console.log(`... Connecting to pigpiod daemon`);

  pigpio.once('connected', (info: {[index: string]: string}) => {
    // display information on pigpio and connection status
    console.log('SUCCESS: has been connected successfully to the pigpio daemon');

    wasConnected = true;
    resolve();
  });

  // Errors are emitted unless you provide API with callback.
  pigpio.on('error', (err: {message: string})=> {
    console.error('Application received error: ', err.message); // or err.stack

    if (!wasConnected) reject(`Can't connect: ${JSON.stringify(err)}`);
  });

  pigpio.on('disconnected', (reason: string) => {
    console.log('App received disconnected event, reason: ', reason);
    console.log('App reconnecting in 1 sec');
    setTimeout( pigpio.connect, 1000, {host: 'raspberryHostIP'});
  });

  setTimeout(() => {
    if (wasConnected) return;
    reject(`Can't connect to pigpiod, timeout has been exceeded`);
  }, CONNECTION_TIMEOUT);
});


// TODO: все выводы в log выводить в системный логгер (возможно через события)


export default class Digital implements DigitalIo {
  // TODO: add type ???
  private readonly pinInstances: {[index: string]: any} = {};
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  // pin change listeners by pin
  private readonly pinListeners: {[index: string]: GpioHandler} = {};
  // debounce times by pin number
  //private debounceTimes: {[index: string]: number | undefined} = {};

  private readonly resistors: {[index: string]: InputResistorMode | OutputResistorMode} = {};
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly throttleCall: ThrottleCall = new ThrottleCall();


  async init() {
    // TODO: make connection
    //await connectionPromise;
  }

  destroy(): Promise<void> {
    // TODO: destroy
  }


  async configure(definition: any): Promise<void> {
    // TODO: save config
  }


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void> {
    if (this.pinInstances[pin]) {
      throw new Error(
        `Digital IO setupInput(): Pin ${pin} has been set up before. ` +
        `You should to call \`clearPin(${pin})\` and after that try again.`
      );
    }

    // save debounce time
    this.debounceTimes[pin] = debounce;

    // TODO: edge - this.resolveEdge(edge),

    const pinInstance = pigpio.gpio(pin);
    this.pinInstances[pin] = pinInstance;
    await callPromised(pinInstance.modeSet, 'input');
    await callPromised(this.pinInstances[pin].pullUpDown, this.convertInputResistorMode(inputMode));

    if (inputMode === 'input_pullup') {
      await callPromised(pinInstance.pullUpDown, 2);
    }
    else if (inputMode === 'input_pulldown') {
      await callPromised(pinInstance.pullUpDown, 1);
    }


    // Returns a numbr - 0 for input
    //console.log('--------- mode', await callPromised(this.pinInstances[pin].modeGet));
  }

  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    if (this.pinInstances[pin]) {
      throw new Error(
        `Digital IO setupOutput(): Pin ${pin} has been set up before. ` +
        `You should to call \`clearPin(${pin})\` and after that try again.`
      );
    }

    this.pinInstances[pin] = pigpio.gpio(pin);
    await callPromised(this.pinInstances[pin].modeSet, 'output');
    await callPromised(this.pinInstances[pin].pullUpDown, this.convertOutputResistorMode(outputMode));

    // set initial value if is set
    if (typeof initialValue !== 'undefined') await callPromised(this.write, pin, initialValue);
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    // TODO: add - use modeGet
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> {
    const pinInstance = this.getPinInstance('getPinMode', pin);
    const modeConst: number = await callPromised(pinInstance.modeGet);

    if (modeConst === 0) {
      return 'input';

      // TODO: add support of input_pullup and input_pulldown
    }
    else {

      // TODO: which const in output ????

      return 'output';
    }
  }

  async read(pin: number): Promise<boolean> {
    const pinInstance = this.getPinInstance('read', pin);

    // returns 0 or 1
    const result: number = await callPromised(pinInstance.read);

    return Boolean(result);
  }

  async write(pin: number, value: boolean): Promise<void> {
    // TODO: add checks ????

    const pinInstance = this.getPinInstance('write', pin);
    const numValue = (value) ? 1 : 0;

    return callPromised(pinInstance.write, numValue);
  }

  async onChange(pin: number, handler: ChangeHandler): Promise<number> {
    return this.events.addListener(pin, handler);

    // const pinInstance = this.getPinInstance('setWatch', pin);
    //
    // const handlerWrapper: GpioHandler = (level: number, tick: number) => {
    //   const value: boolean = Boolean(level);
    //
    //   // if undefined or 0 - call handler immediately
    //   if (!this.debounceTimes[pin]) {
    //     handler(value);
    //   }
    //   else {
    //     // wait for debounce and read current level
    //     this.debounceCall.invoke(pin, this.debounceTimes[pin], async () => {
    //       const realLevel = await this.read(pin);
    //       handler(realLevel);
    //     });
    //   }
    // };
    //
    // // register
    // this.alertListeners.push({ pin, handler: handlerWrapper });
    // // start listen
    // pinInstance.notify(handlerWrapper);
    //
    // // return an index
    // return this.alertListeners.length - 1;
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex);

    // if (typeof id === 'undefined') {
    //   throw new Error(`You have to specify a watch id`);
    // }
    //
    // // it has been removed recently
    // if (!this.alertListeners[id]) return;
    //
    // const {pin, handler} = this.alertListeners[id];
    // const pinInstance = this.getPinInstance('clearWatch', pin);
    //
    // pinInstance.endNotify(handler);
    //
    // delete this.alertListeners[id];
  }

  async clearPin(pin: number): Promise<void> {
    // TODO: add
  }

  async clearAll(): Promise<void> {
    for (let index in this.pinInstances) {
      await this.clearPin(parseInt(index));
    }
  }


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

  private convertInputResistorMode(resistorMode: InputResistorMode): number {
    switch (resistorMode) {
      case (InputResistorMode.none):
        return 0;
      case (InputResistorMode.pulldown):
        return 1;
      case (InputResistorMode.pullup):
        return 2;
      default:
        throw new Error(`Unknown mode "${resistorMode}"`);
    }
  }

  private convertOutputResistorMode(resistorMode: OutputResistorMode): number {
    switch (resistorMode) {
      case (OutputResistorMode.none):
        return 0;

      case (OutputResistorMode.opendrain):
        //throw new Error(`Open-drain mode isn't supported`);
        // TODO: выяснить можно ли включить open drain? может нужно использовать Gpio.PUD_UP
        return 2;
      default:
        throw new Error(`Unknown mode "${resistorMode}"`);
    }
  }

  private getPinInstance(methodWhichAsk: string, pin: number): any {
    if (!this.pinInstances[pin]) {
      throw new Error(`Digital dev ${methodWhichAsk}: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

}
