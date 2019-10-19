// @ts-ignore
import {Gpio} from 'pigpio';

import DigitalIo, {
  ChangeHandler,
  Edge,
  InputResistorMode,
  OutputResistorMode,
  PinDirection,
} from 'system/interfaces/io/DigitalIo';
import DebounceCall from 'system/lib/DebounceCall';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';


type GpioHandler = (level: number) => void;

const INT_EVENT_NAME = 'interrupt';


export default class Digital implements DigitalIo {
  private readonly pinInstances: {[index: string]: Gpio} = {};
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  // pin change listeners by
  private readonly pinListeners: {[index: string]: GpioHandler} = {};
  // resistor constant of pins by id
  private readonly resistors: {[index: string]: InputResistorMode | OutputResistorMode} = {};
  // TODO: use real debounce not increasing
  // TODO: неправильный debounce - нужно просто ждать и считать потом финальное значение
  private readonly debounceCall: DebounceCall = new DebounceCall();


  async destroy(): Promise<void> {
    await this.clearAll();

    this.events.destroy();
    this.debounceCall.destroy();
  }


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void> {
    const pullUpDown: number = this.convertInputResistorMode(inputMode);
    // make a new instance of Gpio
    this.pinInstances[pin] = new Gpio(pin, {
      pullUpDown,
      mode: Gpio.INPUT,
      edge: this.resolveEdge(edge),
      //alert: true,
    });
    this.resistors[pin] = inputMode;

    this.pinListeners[pin] = (level: number) => this.handlePinChange(pin, level, debounce);
    // start listen pin changes
    // TODO: чем interrupt отличается от alert ???
    this.pinInstances[pin].on(INT_EVENT_NAME, this.pinListeners[pin]);
  }

  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    const pullUpDown: number = this.convertOutputResistorMode(outputMode);

    this.pinInstances[pin] = new Gpio(pin, {
      pullUpDown,
      mode: Gpio.OUTPUT,
    });
    this.resistors[pin] = outputMode;

    // set initial value if is set
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    return this.resolvePinDirection(pin);
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before.
   * To be sure about direction, please check it before.
   */
  async getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> {
    return this.resistors[pin];
  }

  async read(pin: number): Promise<boolean> {
    const pinInstance = this.getPinInstance('read', pin);

    return Boolean(pinInstance.digitalRead());
  }

  async write(pin: number, value: boolean): Promise<void> {
    const pinDirection: PinDirection | undefined = this.resolvePinDirection(pin);

    if (typeof pinDirection === 'undefined') {
      throw new Error(`Digital.write: pin ${pin} hasn't been set up yet`);
    }
    else if (pinDirection !== PinDirection.output) {
      throw new Error(`Digital.write: pin ${pin}: writing is allowed only for output pins`);
    }

    const pinInstance = this.getPinInstance('write', pin);
    const numValue = (value) ? 1 : 0;

    pinInstance.digitalWrite(numValue);
  }

  async onChange(pin: number, handler: ChangeHandler): Promise<number> {
    // TODO: по сути можно сейчас навешиваться даже если пин не проинициализирован
    //const pinDirection: PinDirection | undefined = this.resolvePinDirection(pin);
    // if (typeof pinDirection === 'undefined') {
    //   throw new Error(`Digital.onChange: pin ${pin} hasn't been set up yet`);
    // }
    // else if (pinDirection !== PinDirection.input) {
    //   throw new Error(
    //     `Digital.onChange: pin ${pin}: listening of change events ` +
    //     `are allowed only for input pins`
    //   );
    // }

    return this.events.addListener(pin, handler);
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex);
  }

  async clearPin(pin: number): Promise<void> {
    if (!this.pinInstances[pin]) return;

    this.events.removeAllListeners(pin);
    this.pinInstances[pin].removeListener(INT_EVENT_NAME, this.pinListeners[pin]);

    // TODO: не вызовет ли ошибки если не исользовалось?
    // TODO: не отключит ли навсегда, что даже при следующем запуске будет выключенно???
    // TODO: нужно ли включать/выключать interrupt or alert при старте и дестрое ???
    this.pinInstances[pin].disableInterrupt();
    this.pinInstances[pin].disableAlert();

    delete this.pinListeners[pin];
    delete this.resistors[pin];
    delete this.pinInstances[pin];
  }

  async clearAll(): Promise<void> {
    for (let index in this.pinInstances) {
      await this.clearPin(parseInt(index));
    }
  }


  private handlePinChange(pin: number, level: number, debounce: number) {
    const value: boolean = Boolean(level);

    // if undefined or 0 - call handler immediately
    if (!debounce) {
      this.events.emit(pin, value);
    }
    else {
      // TODO: remake
      // wait for debounce and read current level
      this.debounceCall.invoke(async () => {
        const realLevel = await this.read(pin);

        this.events.emit(pin, realLevel);
      }, debounce, pin);
    }
  }

  private convertInputResistorMode(resistorMode: InputResistorMode): number {
    switch (resistorMode) {
      case (InputResistorMode.none):
        return Gpio.PUD_OFF;
      case (InputResistorMode.pullup):
        return Gpio.PUD_UP;
      case (InputResistorMode.pulldown):
        return Gpio.PUD_DOWN;
      default:
        throw new Error(`Unknown mode "${resistorMode}"`);
    }
  }

  private convertOutputResistorMode(resistorMode: OutputResistorMode): number {
    switch (resistorMode) {
      case (OutputResistorMode.none):
        return Gpio.PUD_OFF;

      case (OutputResistorMode.opendrain):
        //throw new Error(`Open-drain mode isn't supported`);
        // TODO: выяснить можно ли включить open drain? может нужно использовать Gpio.PUD_UP
        return Gpio.PUD_UP;
      default:
        throw new Error(`Unknown mode "${resistorMode}"`);
    }
  }

  private resolveEdge(edge: Edge): number {
    if (edge === Edge.rising) {
      return Gpio.RISING_EDGE;
    }
    else if (edge === Edge.falling) {
      return Gpio.FALLING_EDGE;
    }

    return Gpio.EITHER_EDGE;
  }

  private resolvePinDirection(pin: number): PinDirection | undefined {
    let pinInstance: Gpio;

    try {
      pinInstance = this.getPinInstance('resolvePinDirection', pin);
    }
    catch (e) {
      // if instance of pin hasn't been created yet = undefined
      return;
    }

    // it returns input or output. Input by default.
    const modeConst: number = pinInstance.getMode();

    if (modeConst === Gpio.OUTPUT) {
      return PinDirection.output;
    }

    return PinDirection.input;
  }

  private getPinInstance(methodWhichAsk: string, pin: number): Gpio {
    if (!this.pinInstances[pin]) {
      throw new Error(`Nodejs Digital io ${methodWhichAsk}: You have to do setup of local GPIO pin "${pin}" before manipulating it`);
    }

    return this.pinInstances[pin];
  }

}
