/*
 * It uses a pigpiod daemon via websocket.
 */

import DigitalIo, {ChangeHandler} from '../../system/interfaces/io/DigitalIo';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../../system/interfaces/gpioTypes';
import ThrottleCall from '../../system/lib/debounceCall/ThrottleCall';
import DebounceCall from '../../system/lib/debounceCall/DebounceCall';
import IndexedEventEmitter from '../../system/lib/IndexedEventEmitter';
import instantiatePigpioClient, {PigpioClient} from '../helpers/PigpioClient';
import PigpioWrapper, {PigpioHandler, PigpioOptions} from '../helpers/PigpioWrapper';


// TODO: все выводы в log выводить в системный логгер (возможно через события)


export default class Digital implements DigitalIo {
  private readonly pigpioClient: PigpioClient;
  private readonly pinInstances: {[index: string]: PigpioWrapper} = {};
  // pin change listeners by pin
  private readonly pinListeners: {[index: string]: PigpioHandler} = {};
  private readonly resistors: {[index: string]: InputResistorMode | OutputResistorMode} = {};
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly throttleCall: ThrottleCall = new ThrottleCall();


  // TODO: review может всетаки сделать init()
  constructor() {
    this.pigpioClient = instantiatePigpioClient();
  }

  async destroy(): Promise<void> {
    this.debounceCall.destroy();
    this.throttleCall.destroy();
    await this.pigpioClient.destroy();
    this.events.destroy();
  }

  async configure(clientOptions: PigpioOptions): Promise<void> {
    await this.pigpioClient.init(clientOptions);
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

    const pullUpDown: number = this.convertInputResistorMode(inputMode);

    this.pinInstances[pin] = this.pigpioClient.makePinInstance(pin);

    await this.pinInstances[pin].modeSet('input');
    await this.pinInstances[pin].pullUpDown(pullUpDown);

    this.pinListeners[pin] = (level: number, tick: number) =>
      this.handlePinChange(pin, level, tick, debounce, edge);

    this.pinInstances[pin].notify(this.pinListeners[pin]);
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

    const pullUpDown: number = this.convertOutputResistorMode(outputMode);
    // make instance
    this.pinInstances[pin] = this.pigpioClient.makePinInstance(pin);
    // save resistor mode
    this.resistors[pin] = outputMode;
    // make setup
    await this.pinInstances[pin].modeSet('output');
    await this.pinInstances[pin].pullUpDown(pullUpDown);
    // set initial value if it defined
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    const modeNum: number = await this.pinInstances[pin].modeGet();

    if (modeNum === 0) {
      return PinDirection.input;
    }

    return PinDirection.output;
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> {
    return this.resistors[pin];
  }

  async read(pin: number): Promise<boolean> {
    return this.simpleRead(pin);
  }

  async write(pin: number, value: boolean): Promise<void> {
    // TODO: add checks ????

    const pinInstance = this.getPinInstance('write', pin);
    const numValue: number = (value) ? 1 : 0;

    return pinInstance.write(numValue);
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
    // TODO: use gpio.endNotify(cb)
  }

  async clearAll(): Promise<void> {
    for (let index in this.pinInstances) {
      await this.clearPin(parseInt(index));
    }
  }


  private handlePinChange(pin: number, numLevel: number, tick: number, debounce: number, edge: Edge) {
    const level: boolean = Boolean(numLevel);

    // don't handle edge which is not suitable to edge that has been set up
    if (edge === Edge.rising && !level) {
      return;
    }
    else if (edge === Edge.falling && level) {
      return;
    }

    // if undefined or 0 - call handler immediately
    if (!debounce) {
      return this.events.emit(pin, level);
    }
    // use throttle instead of debounce if rising or falling edge is set
    else if (edge === Edge.rising || edge === Edge.falling) {
      this.throttleCall.invoke(() => {
        this.events.emit(pin, level);
      }, debounce, pin)
        .catch((e) => {
          // TODO: call IO's logError()
          console.error(e);
        });

      return;
    }
    // else edge both and debounce is set
    // wait for debounce and read current level and emit an event
    // TODO: вернет promise
    this.debounceCall.invoke(() => this.handleEndOfDebounce(pin), debounce, pin)
      .catch((e) => {
        // TODO: call IO's logError()
        console.error(e);
      });
  }

  private async handleEndOfDebounce(pin: number) {
    let realLevel: boolean;

    try {
      realLevel = await this.simpleRead(pin);
    }
    catch (e) {
      // TODO: call IO's logError()
      return console.error(e);
    }

    this.events.emit(pin, realLevel);
  }

  private async simpleRead(pin: number): Promise<boolean> {
    const pinInstance = this.getPinInstance('simpleRead', pin);

    // returns 0 or 1
    const result: number = await pinInstance.read();

    return Boolean(result);
  }

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

  private getPinInstance(methodWhichAsk: string, pin: number): PigpioWrapper {
    if (!this.pinInstances[pin]) {
      throw new Error(`Digital dev ${methodWhichAsk}: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

}
