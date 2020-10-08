import Context from 'system/Context';

import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import DigitalInputIo, {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import {DigitalExpanderInputDriver} from './interfaces/DigitalExpanderDriver';
import DigitalExpanderInputLogic from './DigitalExpanderInputLogic';
import SemiDuplexFeedbackLogic from '../SemiDuplexFeedbackLogic';
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

    // TODO: запустить как только засетапится 1й инпут (закончит сетап)
    // TODO: !!!!!
    //this.feedback.startFeedback();
    // if (this.polling && !this.polling.isInProgress()) {

    return this.logic.setupPin(pin, inputMode, localDebounce, edge);
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
    this.logic.clearPin(pin);
    await this.props.driver.clearPin(pin);
  }

  async clearAll(): Promise<void> {
    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }

}
