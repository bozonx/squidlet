import Context from 'system/Context';

import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import DigitalInputIo, {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import {DigitalExpanderInputDriver} from './interfaces/DigitalExpanderDriver';
import DigitalExpanderInputLogic from './DigitalExpanderInputLogic';
import SemiDuplexFeedbackLogic from '../SemiDuplexFeedbackLogic';
import {ImpulseInputProps} from '../../../entities/drivers/ImpulseInput/ImpulseInput';


export interface DigitalExpanderInputProps {
  driver: DigitalExpanderInputDriver;
  // if true then local debounce of pins will be used.
  // if false then microcontroller's debounce will be used.
  // default is true.
  useLocalDebounce?: boolean;
  waitResultTimeoutSec: number;
  pollIntervalMs: number;
  interrupt?: ImpulseInputProps;
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
        // TODO: use compareResult ???
        compareResult: true,
        read: this.props.driver.read,
        interrupt: props.interrupt,
        pollIntervalMs: props.pollIntervalMs,
      }
    );
    this.logic = new DigitalExpanderInputLogic(
      context.log.error,
      this.feedback.pollOnce,
      props.waitResultTimeoutSec,
      props.pollIntervalMs,
      !props.interrupt
    );
    this.useLocalDebounce = (typeof props.useLocalDebounce === 'undefined')
      // true is default
      ? true
      // or use defined one
      : props.useLocalDebounce;

    // TODO: использовать input драйвер + логику impulseInput
    // TODO: нужно сделать this.feedback.init() либо сразу передать готовый драйвер int

    //this.props.driver.onChange(this.feedback.handleIncomeState);
    this.feedback.addListener(this.logic.handleIncomeState);
    // TODO: здесь делать старт или в init() ????
    this.feedback.startFeedback();
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
