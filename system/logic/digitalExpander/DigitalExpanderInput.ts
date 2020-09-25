import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import DigitalInputIo, {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import {DigitalExpanderInputDriver} from './interfaces/DigitalExpanderDriver';
import DigitalInputLogic from './DigitalInputLogic';


interface Props {
}


export default class DigitalExpanderInput implements DigitalInputIo {
  private readonly driver: DigitalExpanderInputDriver;
  private readonly logic: DigitalInputLogic;


  constructor(
    driver: DigitalExpanderInputDriver,
    logError: (msg: Error | string) => void,
    props: Props,
  ) {
    this.driver = driver;
    this.logic = new DigitalInputLogic(
      logError,
      this.driver.doPoll
    );

    this.driver.onChange(this.logic.handleIncomeState);
  }


  setup(
    pin: number,
    inputMode: InputResistorMode,
    debounce: number,
    edge: Edge
  ): Promise<void> {
    return this.logic.setupInput(pin, inputMode, debounce, edge);
  }

  /**
   * Just read a current state
   * @param pin
   */
  async read(pin: number): Promise<boolean> {

    // TODO: может сделать запрос в driver и слушать ближайший ответ ???

    return this.logic.getState()[pin];
  }

  async onChange(pin: number, handler: ChangeHandler): Promise<number> {

    // TODO: make driver's ???

    //return this.logic.onChange(pin, handler);
  }

  async removeListener(handlerIndex: number): Promise<void> {

    // TODO: make driver's ???

    //this.logic.removeListener(handlerIndex);
  }

  async clearPin(pin: number): Promise<void> {
    this.logic.clearPin(pin);

    // TODO: make driver's clear pin
  }

  async clearAll(): Promise<void> {
    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }

}
