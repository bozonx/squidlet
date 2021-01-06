import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../../../../squidlet-networking/src/interfaces/__old/io/DigitalOutputIo';
import {DigitalExpanderOutputDriver, DigitalExpanderPinSetup} from './interfaces/DigitalExpanderDriver';
import DigitalExpanderOutputLogic from './DigitalExpanderOutputLogic';
import Context from '../../../../src/system/Context';


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
      (pin: number): boolean => this.props.driver.wasPinInitialized(pin),
      (pin: number): DigitalExpanderPinSetup | undefined =>
        this.props.driver.getPinProps(pin),
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

    // TODO: better to use race ???

    return Promise.all(Object.keys(this.logic.getState()).map((pin: string) => {
      return this.clearPin(parseInt(pin));
    }))
      .then();
  }


  private writeCb = (state: {[index: string]: boolean}): Promise<void> => {
    return this.props.driver.writeState(state);
  }

}
