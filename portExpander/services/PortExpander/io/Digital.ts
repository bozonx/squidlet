import DigitalIo, {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import PinChangeLogic from 'system/lib/logic/PinChangeLogic';

import {PORT_EXPANDER_FEEDBACK, PORT_EXPANDER_FUNCTIONS} from '../constants';
import ExpanderFunctionCall from '../ExpanderFunctionCall';


export default class Digital implements DigitalIo {
  private readonly functionCall: ExpanderFunctionCall;
  private readonly pinChangeLogic: PinChangeLogic;

  //private readonly resistors: {[index: string]: InputResistorMode | OutputResistorMode} = {};
  //private readonly events = new IndexedEventEmitter<ChangeHandler>();


  constructor(functionCall: ExpanderFunctionCall) {
    this.functionCall = functionCall;
    this.pinChangeLogic = new PinChangeLogic(this.simpleRead, this.log.error);

    this.functionCall.onMessage(this.handleIncomeMessages);
  }


  async destroy(): Promise<void> {
    this.pinChangeLogic.destroy();
    this.functionCall.destroy();
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
    return this.pinChangeLogic.onChange(pin, handler);
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.pinChangeLogic.removeListener(handlerIndex);
  }

  // TODO: add
  async clearPin(pin: number): Promise<void> {
    delete this.resistors[pin];

    this.events.removeAllListeners(pin);
    this.debounceCall.clear(pin);
    this.throttleCall.clear(pin);
    this.client.clearPin(pin);
  }

  // TODO: add
  async clearAll(): Promise<void> {
    for (let pin of this.client.getInstantiatedPinList()) {
      await this.clearPin(parseInt(pin));
    }
  }


  private handleIncomeMessages(funcNum: number, args: Uint8Array) {
    if (funcNum !== PORT_EXPANDER_FEEDBACK.digitalInputRead) return;

    //this.events.emit(args[0], Boolean(args[1]));
    this.pinChangeLogic.handlePinChange(
      args[0],
      Boolean(args[1]),
      debounce,
      edge
    );
  }

  private simpleRead = async (pin: number): Promise<boolean> => {
    const result: Uint8Array = await this.functionCall.request(
      PORT_EXPANDER_FUNCTIONS.digitalReadForce,
      // TODO: feedback всетаки отдельно или вместе в functions ???
      PORT_EXPANDER_FEEDBACK.digitalInputRead,
      new Uint8Array([pin])
    );

    return Boolean(result[0]);
  }

}
