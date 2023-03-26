import Context from 'src/system/Context';

import {Edge, InputResistorMode, PinDirection} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';
import DigitalInputIo, {ChangeHandler} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo.js';
import {DigitalExpanderInputDriver, DigitalExpanderPinSetup} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/logic/digitalExpander/interfaces/DigitalExpanderDriver.js';
import DigitalExpanderInputLogic from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/logic/digitalExpander/DigitalExpanderInputLogic.js';
import SemiDuplexFeedbackLogic from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/logic/SemiDuplexFeedbackLogic.js';
import {ImpulseInput} from '../../../entities/drivers/ImpulseInput/ImpulseInput';


export interface DigitalExpanderInputProps {
  driver: DigitalExpanderInputDriver;
  intDriver?: ImpulseInput;
  // if true then local debounce of pins will be used.
  // if false then microcontroller's debounce will be used.
  // default is true.
  useLocalDebounce?: boolean;
  waitResultTimeoutSec: number;
  pollIntervalMs: number;
}


/**
 * It connects driver with input logic
 */
export default class DigitalInputSemiDuplex implements DigitalInputIo {
  //private readonly context: Context;
  private readonly props: DigitalExpanderInputProps;
  private readonly feedback: SemiDuplexFeedbackLogic;
  private readonly logic: DigitalExpanderInputLogic;
  private readonly useLocalDebounce: boolean;


  constructor(
    context: Context,
    props: DigitalExpanderInputProps,
  ) {
    //this.context = context;
    this.props = props;
    this.feedback = new SemiDuplexFeedbackLogic(
      context,
      {
        intDriver: this.props.intDriver,
        // TODO: use compareResult ???
        compareResult: true,
        // TODO: если не был сделан setup хоть одного пина - то возвращать undefined
        read: this.props.driver.readInputPins,
        pollIntervalMs: props.pollIntervalMs,
      }
    );
    this.logic = new DigitalExpanderInputLogic(
      context.log.error,
      // TODO: does it really need ???
      this.feedback.pollOnce,
      props.waitResultTimeoutSec,
      //props.pollIntervalMs,
      //!props.intDriver
    );
    this.useLocalDebounce = (typeof props.useLocalDebounce === 'undefined')
      // true is default
      ? true
      // or use defined one
      : props.useLocalDebounce;

    this.feedback.addListener(this.logic.handleIncomeState);
  }

  destroy = async () => {
    this.feedback.destroy();
    this.logic.destroy();
  }


  async setup(
    pin: number,
    inputMode: InputResistorMode,
    debounce: number,
    edge: Edge
  ): Promise<void> {
    let localDebounce: number = debounce;
    let remoteDebounce: number = 0;

    if (!this.useLocalDebounce) {
      localDebounce = 0;
      remoteDebounce = debounce;
    }

    await this.props.driver.setupInput(pin, inputMode, remoteDebounce);
    await this.logic.setupPin(pin, inputMode, localDebounce, edge);

    // start feedback after the first input pin has been set up
    if (!this.feedback.isFeedbackStarted()) this.feedback.startFeedback();
  }

  read(pin: number): Promise<boolean> {
    return this.logic.read(pin);
  }

  async onChange(pin: number, handler: ChangeHandler): Promise<number> {
    return this.logic.onChange(pin, handler);
  }

  async removeListener(handlerIndex: number): Promise<void> {
    this.logic.removeListener(handlerIndex);
  }

  async clearPin(pin: number): Promise<void> {
    await this.props.driver.clearPin(pin);
    this.logic.clearPin(pin);

    if (!this.areThereAnyInputs()) {
      this.feedback.stopFeedBack();
    }
  }

  async clearAll(): Promise<void> {

    // TODO: better to use race ???

    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }


  private areThereAnyInputs(): boolean {
    const pinsProps: {[index: string]: DigitalExpanderPinSetup} = this.props.driver
      .getAllPinsProps();

    for (let pinStr of Object.keys(pinsProps)) {
      if (pinsProps[pinStr].direction === PinDirection.input) {
        return true;
      }
    }

    return false;
  }

}
