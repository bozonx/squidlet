import DigitalIo, {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';

import {PORT_EXPANDER_FEEDBACK, PORT_EXPANDER_FUNCTIONS} from '../constants';
import ExpanderFunctionCall from '../ExpanderFunctionCall';


export default class Digital implements DigitalIo {
  private readonly functionCall: ExpanderFunctionCall;

  //private readonly resistors: {[index: string]: InputResistorMode | OutputResistorMode} = {};
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  // private readonly debounceCall: DebounceCall = new DebounceCall();
  // private readonly throttleCall: ThrottleCall = new ThrottleCall();


  constructor(functionCall: ExpanderFunctionCall) {
    this.functionCall = functionCall;

    this.functionCall.onMessage(this.handleIncomeMessages);
  }


  async destroy(): Promise<void> {
    this.functionCall.destroy();

    // this.debounceCall.destroy();
    // this.throttleCall.destroy();
    // this.events.destroy();
  }


  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupInput(pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void> {
    if (inputMode === InputResistorMode.pulldown) {
      // TODO: review, может это режим по умолчанию
      // TODO: проверить на соответсвующем мк
      throw new Error(`Port expander on arduino doesn't support a pulldown resistor`);
    }

    // make setup
    await this.functionCall.callFunc(
      PORT_EXPANDER_FUNCTIONS.digitalInputSetup,
      new Uint8Array([pin, inputMode])
    );
  }

  /**
   * Setup pin before using.
   * It doesn't set an initial value on output pin because a driver have to use it.
   */
  async setupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    if (outputMode && outputMode === OutputResistorMode.opendrain) {
      // TODO: review, может это режим по умолчанию
      // TODO: проверить на соответсвующем мк
      throw new Error(`Port expander on arduino doesn't support an opendrain resistor`);
    }

    // make setup
    await this.functionCall.callFunc(
      PORT_EXPANDER_FUNCTIONS.digitalOutputSetup,
      new Uint8Array([pin])
    );
    // set initial value if it defined
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    // if (!this.client.connected) throw new Error(`Pigpio client hasn't been connected`);
    //
    // const pinInstance = this.getPinInstance('getPinDirection', pin);
    //
    // const modeNum: number = await pinInstance.modeGet();
    //
    // if (modeNum === 0) {
    //   return PinDirection.input;
    // }
    //
    // return PinDirection.output;
  }

  /**
   * Get pin mode.
   * It throws an error if pin hasn't configured before
   */
  async getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> {
    //return this.resistors[pin];
    // TODO: add
  }

  async read(pin: number): Promise<boolean> {
    return this.simpleRead(pin);
  }

  async write(pin: number, value: boolean): Promise<void> {
    return this.functionCall.callFunc(
      PORT_EXPANDER_FUNCTIONS.digitalOutputWrite,
      new Uint8Array([Number(value)])
    );
  }

  async onChange(pin: number, handler: ChangeHandler): Promise<number> {
    return this.events.addListener(pin, handler);
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex);
  }


  private handleIncomeMessages(funcNum: number, args: Uint8Array) {
    if (funcNum !== PORT_EXPANDER_FEEDBACK.digitalInputRead) return;

    this.events.emit(args[0], Boolean(args[1]));
  }

  private async simpleRead(pin: number): Promise<boolean> {
    const result: Uint8Array = await this.functionCall.request(
      PORT_EXPANDER_FUNCTIONS.digitalReadForce,
      // TODO: feedback всетаки отдельно или вместе в functions ???
      PORT_EXPANDER_FEEDBACK.digitalInputRead,
      new Uint8Array([pin])
    );

    return Boolean(result[0]);
  }






  ///////////////////////////





  async clearPin(pin: number): Promise<void> {
    delete this.resistors[pin];

    this.events.removeAllListeners(pin);
    this.debounceCall.clear(pin);
    this.throttleCall.clear(pin);
    this.client.clearPin(pin);
  }

  async clearAll(): Promise<void> {
    for (let pin of this.client.getInstantiatedPinList()) {
      await this.clearPin(parseInt(pin));
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
          this.ioContext.log.error(e);
        });

      return;
    }
    // else edge both and debounce is set
    // wait for debounce and read current level and emit an event
    // TODO: handleEndOfDebounce will return a promise
    this.debounceCall.invoke(() => this.handleEndOfDebounce(pin), debounce, pin)
      .catch((e) => {
        this.ioContext.log.error(e);
      });
  }

  private async handleEndOfDebounce(pin: number) {
    let realLevel: boolean;

    try {
      realLevel = await this.simpleRead(pin);
    }
    catch (e) {
      return this.ioContext.log.error(e);
    }

    this.events.emit(pin, realLevel);
  }

}
