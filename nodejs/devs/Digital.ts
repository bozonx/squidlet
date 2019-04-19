// @ts-ignore
const pigpio = require('pigpio-client').pigpio({host: 'localhost'});

import DigitalDev, {
  Edge,
  DigitalPinMode,
  WatchHandler,
  DigitalInputMode
} from 'system/interfaces/dev/DigitalDev';
import DebounceCall from 'system/helpers/DebounceCall';
import {callPromised} from 'system/helpers/helpers';


type GpioHandler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}


// TODO: все выводы в log выводить в системный логгер (возможно через события)


export default class Digital implements DigitalDev {
  private readonly pinInstances: {[index: string]: any} = {};
  private readonly alertListeners: Listener[] = [];
  private readonly debounceCall: DebounceCall = new DebounceCall();
  // debounce times by pin number
  private debounceTimes: {[index: string]: number | undefined} = {};


  async init() {
    let wasConnected = false;

    return new Promise((resolve, reject) => {
      pigpio.once('connected', (info: {[index: string]: any}) => {
        // display information on pigpio and connection status
        console.log(JSON.stringify(info,null,2));

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

    });
  }


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void> {
    // save debounce time
    this.debounceTimes[pin] = debounce;

    // TODO: edge - this.resolveEdge(edge),

    const pinInstance = pigpio.gpio(pin);
    this.pinInstances[pin] = pinInstance;
    await callPromised(pinInstance.modeSet, 'input');

    if (inputMode === 'input_pullup') {
      await callPromised(pinInstance.pullUpDown, 2);
    }
    else if (inputMode === 'input_pulldown') {
      await callPromised(pinInstance.pullUpDown, 1);
    }
  }

  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupOutput(pin: number, initialValue?: boolean): Promise<void> {
    this.pinInstances[pin] = pigpio.gpio(pin);
    this.pinInstances[pin].modeSet('output');

    // set initial value if is set
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
    const pinInstance = this.getPinInstance('getPinMode', pin);
    const modeConst: number = pinInstance.getMode();

    // TODO: do it

    // if (modeConst === Gpio.INPUT) {
    //   return 'input';
    //
    //   // TODO: add support of input_pullup and input_pulldown
    // }
    // else if (modeConst === Gpio.OUTPUT) {
    //   return 'output';
    // }

    return;
  }

  async read(pin: number): Promise<boolean> {
    const pinInstance = this.getPinInstance('read', pin);

    return Boolean(pinInstance.digitalRead());
  }

  async write(pin: number, value: boolean): Promise<void> {
    const pinInstance = this.getPinInstance('write', pin);
    const numValue = (value) ? 1 : 0;

    return callPromised(pinInstance.write, numValue);
  }

  async setWatch(pin: number, handler: WatchHandler): Promise<number> {



    /*
        // control an LED on GPIO 25
        const LED = pigpio.gpio(25);
        LED.modeSet('output');
        LED.write(1); // turn on LED
        LED.write(0); // turn off
        LED.analogWrite(128); // set to 50% duty cycle (out of 255)

        // get events from a button on GPIO 17
        const Button = pigpio.gpio(17);
        Button.modeSet('input');
        Button.notify((level, tick)=> {
          console.log(`Button changed to ${level} at ${tick} usec`)
        });
     */


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

    // it has been removed recently
    if (!this.alertListeners[id]) return;

    const {pin, handler} = this.alertListeners[id];
    const pinInstance = this.getPinInstance('clearWatch', pin);

    pinInstance.off('interrupt', handler);

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
  //
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

  private getPinInstance(methodWhichAsk: string, pin: number): any {
    if (!this.pinInstances[pin]) {
      throw new Error(`Digital dev ${methodWhichAsk}: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

}
