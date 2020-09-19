import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import DigitalExpanderLogic from './DigitalExpanderLogic';


export default class DigitalExpanderInputLogic {
  private logic: DigitalExpanderLogic;


  // TODO: принимать logError ???
  constructor(logic: DigitalExpanderLogic) {
    this.logic = logic;
  }


  setup(
    pin: number,
    inputMode: InputResistorMode,
    debounce: number,
    edge: Edge
  ): Promise<void> {

  }

  getPinResistorMode(pin: number): Promise<InputResistorMode | undefined> {

  }

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
