import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../interfaces/io/DigitalOutputIo';
import {DigitalExpanderOutputDriver} from './interfaces/DigitalExpanderDriver';
import DigitalOutputLogic from './DigitalOutputLogic';


interface Props {
  writeBufferMs?: number;
  queueJobTimeoutSec?: number;
}


export default class DigitalExpanderOutput implements DigitalOutputIo {
  private readonly driver: DigitalExpanderOutputDriver;
  private readonly logic: DigitalOutputLogic;


  constructor(
    driver: DigitalExpanderOutputDriver,
    logError: (msg: Error | string) => void,
    props: Props,
  ) {
    this.driver = driver;
    this.logic = new DigitalOutputLogic(
      logError,
      this.writeCb,
      props.queueJobTimeoutSec,
      props.writeBufferMs
    );
  }

  destroy = async () => {
    this.logic.destroy();
  }


  setup(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    return this.driver.setupOutput(pin, outputMode, initialValue);
  }

  write(pin: number, value: boolean): Promise<void> {
    return this.logic.write(pin, value);
  }

  async clearPin(pin: number): Promise<void> {
    this.logic.clearPin(pin);
    await this.driver.clearPin(pin);
  }

  clearAll(): Promise<void> {
    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }


  private writeCb = (state: {[index: string]: boolean}): Promise<void> => {
    return this.driver.writeState(state);
  }

}
