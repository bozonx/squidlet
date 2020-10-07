import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import DigitalInputIo, {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import {DigitalExpanderInputDriver} from './interfaces/DigitalExpanderDriver';
import DigitalExpanderInputLogic from './DigitalExpanderInputLogic';


// TODO: remake to full duplex


export interface DigitalExpanderInputProps {
  // if true then local debounce of pins will be used.
  // if false then microcontroller's debounce will be used.
  // default is true.
  useLocalDebounce?: boolean;
  waitResultTimeoutSec: number;
}


export default class DigitalInputSemiDuplex implements DigitalInputIo {
  private readonly driver: DigitalExpanderInputDriver;
  private readonly logic: DigitalExpanderInputLogic;
  private readonly useLocalDebounce: boolean;


  constructor(
    driver: DigitalExpanderInputDriver,
    logError: (msg: Error | string) => void,
    props: DigitalExpanderInputProps,
  ) {
    this.driver = driver;
    this.logic = new DigitalExpanderInputLogic(
      logError,
      this.driver.doPoll,
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

    this.driver.onChange(this.logic.handleIncomeState);
  }

  destroy = async () => {
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

    await this.driver.setupInput(pin, inputMode, remoteDebounce);

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
    await this.driver.clearPin(pin);
  }

  async clearAll(): Promise<void> {
    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }

}
