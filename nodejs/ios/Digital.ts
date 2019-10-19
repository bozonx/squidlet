// @ts-ignore
import {Gpio} from 'pigpio';

import DigitalIo, {
  ChangeHandler,
  Edge,
  InputResistorMode,
  OutputResistorMode,
  PinDirection,
} from 'system/interfaces/io/DigitalIo';
// TODO: неправильный debounce - нужно просто ждать и считать потом финальное значение
import DebounceCall from 'system/lib/DebounceCall';


type GpioHandler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHandler;
}


// TODO: нужно ли включать/выключать interrupt or alert при старте и дестрое ???


export default class Digital implements DigitalIo {
  private readonly pinInstances: {[index: string]: Gpio} = {};
  private readonly alertListeners: Listener[] = [];

  // TODO: запоминать резисторы

  private readonly debounceCall: DebounceCall = new DebounceCall();
  // debounce times by pin number
  private debounceTimes: {[index: string]: number | undefined} = {};


  destroy(): Promise<void> {
    return this.clearAll();
  }


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void> {
    const pullUpDown: number = this.convertInputResistorMode(inputMode);
    // save debounce time
    this.debounceTimes[pin] = debounce;
    // make a new instance of Gpio
    this.pinInstances[pin] = new Gpio(pin, {
      pullUpDown,
      mode: Gpio.INPUT,
      edge: this.resolveEdge(edge),
      //alert: true,
    });
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

    // set initial value if is set
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    return this.resolvePinDirection(pin);
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> {
    // TODO: что будет если пин не скорфигурирован???? наверное ошибка ??? - тогда вернуть undefined
    // TODO: add !!!!
    return;
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
    const pinDirection: PinDirection | undefined = this.resolvePinDirection(pin);

    if (typeof pinDirection === 'undefined') {
      throw new Error(`Digital.onChange: pin ${pin} hasn't been set up yet`);
    }
    else if (pinDirection !== PinDirection.input) {
      throw new Error(
        `Digital.onChange: pin ${pin}: listening of change events ` +
        `are allowed only for input pins`
      );
    }

    const pinInstance = this.getPinInstance('onChange', pin);

    const handlerWrapper: GpioHandler = (level: number) => {
      this.handlePinChange(pin, handler, level);
    };

    // TODO: зачем навешиватьна пин больше 1го листенера????

    // register
    this.alertListeners.push({ pin, handler: handlerWrapper });
    // start listen
    // TODO: чем interrupt отличается от alert ???
    pinInstance.on('interrupt', handlerWrapper);
    //pinInstance.on('alert', handlerWrapper);
    // return an index
    return this.alertListeners.length - 1;
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.clearListener(handlerIndex);
  }

  async clearPin(pin: number): Promise<void> {
    for (let handlerIndex in this.alertListeners) {
      if (this.alertListeners[handlerIndex].pin !== pin) continue;

      this.clearListener(Number(handlerIndex));
    }
  }

  async clearAll(): Promise<void> {
    for (let index in this.pinInstances) {
      await this.clearPin(parseInt(index));
    }
  }


  private handlePinChange(pin: number, handler: ChangeHandler, level: number) {
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
  }

  private clearListener(handlerIndex: number) {
    // it has been removed recently
    if (!this.alertListeners[handlerIndex]) return;

    const {pin, handler} = this.alertListeners[handlerIndex];
    const pinInstance = this.getPinInstance('removeListener', pin);

    pinInstance.off('interrupt', handler);

    delete this.alertListeners[handlerIndex];
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
