import DigitalInputIo, {ChangeHandler} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo.js';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '__old/system/interfaces/gpioTypes';
import PinChangeLogic from '__old/system/logic/PinChangeLogic';

import {PORT_EXPANDER_FEEDBACK, PORT_EXPANDER_FUNCTIONS} from '../constants';
import ExpanderFunctionCall from '../ExpanderFunctionCall';


interface PinParamItem {
  direction: PinDirection;
  resistor: InputResistorMode | OutputResistorMode;
  debounce?: number;
  edge?: Edge;
}


export default class DigitalInput implements DigitalInputIo {
  private readonly functionCall: ExpanderFunctionCall;
  private readonly pinChangeLogic: PinChangeLogic;
  private pinParams: {[index: string]: PinParamItem} = {};


  constructor(functionCall: ExpanderFunctionCall, logError: (msg: string) => void) {
    this.functionCall = functionCall;
    this.pinChangeLogic = new PinChangeLogic(this.simpleRead, logError);

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

    this.pinParams[pin] = {
      direction: PinDirection.input,
      resistor: inputMode,
      debounce,
      edge,
    };

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

    this.pinParams[pin] = {
      direction: PinDirection.output,
      resistor: outputMode,
    };

    // make setup
    await this.functionCall.callFunc(
      PORT_EXPANDER_FUNCTIONS.digitalOutputSetup,
      new Uint8Array([pin])
    );
    // set initial value if it defined
    if (typeof initialValue !== 'undefined') await this.write(pin, initialValue);
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    return this.pinParams[pin]?.direction;
  }

  // /**
  //  * Get pin mode.
  //  * It throws an error if pin hasn't configured before
  //  */
  // async getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> {
  //   return this.pinParams[pin]?.resistor;
  // }

  async read(pin: number): Promise<boolean> {
    return this.simpleRead(pin);
  }

  async write(pin: number, value: boolean): Promise<void> {
    return this.functionCall.callFunc(
      PORT_EXPANDER_FUNCTIONS.digitalOutputWrite,
      new Uint8Array([Number(value)])
    );
  }

  async clearPin(pin: number): Promise<void> {
    delete this.pinParams[pin];

    this.pinChangeLogic.clearPin(pin);

    // TODO: вызвать ф-ю чтобы отписаться от пина
    //this.client.clearPin(pin);
  }

  async clearAll(): Promise<void> {
    for (let pin of Object.keys(this.pinParams)) {
      await this.clearPin(parseInt(pin));
    }
  }

  async onChange(pin: number, handler: ChangeHandler): Promise<number> {
    return this.pinChangeLogic.onChange(pin, handler);
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.pinChangeLogic.removeListener(handlerIndex);
  }


  private handleIncomeMessages(feedbackNum: number, args: Uint8Array) {
    if (feedbackNum !== PORT_EXPANDER_FEEDBACK.digitalInputRead) return;

    const pinNum: number = args[0];

    this.pinChangeLogic.handlePinChange(
      pinNum,
      Boolean(args[1]),
      this.pinParams[pinNum].debounce,
      this.pinParams[pinNum].edge
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
