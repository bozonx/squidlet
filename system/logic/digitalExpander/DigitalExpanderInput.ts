import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import DigitalExpanderLogic from './DigitalExpanderLogic';
import Context from '../../Context';
import DigitalExpanderDriver from './interfaces/DigitalExpanderDriver';


export default class DigitalExpanderInput {
  private readonly context: Context;
  private readonly logic: DigitalExpanderLogic;


  // TODO: принимать logError ???
  constructor(driver: DigitalExpanderDriver, logError: (msg: string) => void) {
    this.context = context;
    this.logic = logic;
  }


  setup(
    pin: number,
    inputMode: InputResistorMode,
    debounce: number,
    edge: Edge
  ): Promise<void> {
    return this.logic.setupInput(pin, inputMode, debounce, edge);
  }

  // async getPinResistorMode(pin: number): Promise<InputResistorMode | undefined> {
  //   return this.logic.getPinResistorMode(pin) as InputResistorMode | undefined;
  // }

  read(pin: number): Promise<boolean> {

  }

  onChange(pin: number, handler: ChangeHandler): Promise<number> {

  }

  removeListener(handlerIndex: number): Promise<void> {

  }

  clearPin(pin: number): Promise<void> {

  }

  clearAll(): Promise<void> {
    for (let pin of Object.keys(this.pinParams)) {
      await this.clearPin(parseInt(pin));
    }
  }
}
