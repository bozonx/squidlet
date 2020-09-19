import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../interfaces/io/DigitalOutputIo';
import DigitalExpanderLogic from './DigitalExpanderLogic';


export default class DigitalExpanderOutputLogic implements DigitalOutputIo {
  private logic: DigitalExpanderLogic;


  // TODO: принимать logError ???
  constructor(logic: DigitalExpanderLogic) {
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
