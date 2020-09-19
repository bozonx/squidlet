import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../interfaces/io/DigitalOutputIo';


export default class DigitalExpanderOutputLogic implements DigitalOutputIo {
  private logic: DigitalExpanderOutputLogic;


  constructor(logic: DigitalExpanderOutputLogic) {
    this.logic = logic;
  }


  setup(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {

  }

  getPinResistorMode(pin: number): Promise<OutputResistorMode | undefined> {

  }

  // // output and input pins can be read
  // read(pin: number): Promise<boolean>;

  write(pin: number, value: boolean): Promise<void> {

  }

  clearPin(pin: number): Promise<void> {

  }

  clearAll(): Promise<void> {

  }

}
