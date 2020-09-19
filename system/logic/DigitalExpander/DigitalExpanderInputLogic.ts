import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';

export default class DigitalExpanderInputLogic {
  private logic: DigitalExpanderInputLogic;


  constructor(logic: DigitalExpanderInputLogic) {
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
