import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../interfaces/io/DigitalOutputIo';
import {DigitalExpanderOutputDriver} from './interfaces/DigitalExpanderDriver';
import DigitalExpanderOutputLogic from './DigitalExpanderOutputLogic';
import Context from '../../Context';


export interface DigitalExpanderOutputProps {
  driver: DigitalExpanderOutputDriver;
  writeBufferMs?: number;
  queueJobTimeoutSec?: number;
}


export default class DigitalOutput implements DigitalOutputIo {
  private readonly props: DigitalExpanderOutputProps;
  private readonly logic: DigitalExpanderOutputLogic;


  constructor(
    context: Context,
    props: DigitalExpanderOutputProps,
  ) {
    this.props = props;
    this.logic = new DigitalExpanderOutputLogic(
      context.log.error,
      this.writeCb,
      props.queueJobTimeoutSec,
      props.writeBufferMs
    );
  }

  destroy = async () => {
    this.logic.destroy();
  }


  setup(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    return this.props.driver.setupOutput(pin, outputMode, initialValue);
  }

  write(pin: number, value: boolean): Promise<void> {
    return this.logic.write(pin, value);
  }

  async clearPin(pin: number): Promise<void> {
    this.logic.clearPin(pin);
    await this.props.driver.clearPin(pin);
  }

  clearAll(): Promise<void> {
    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }


  private writeCb = (state: {[index: string]: boolean}): Promise<void> => {
    return this.props.driver.writeState(state);
  }

}
