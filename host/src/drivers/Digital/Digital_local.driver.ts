import DriverBase, {DriverBaseProps} from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';


export interface DigitalLocalDriverProps extends DriverBaseProps {
}


export class DigitalLocalDriver {
  private readonly digitalDev: Digital;

  constructor(digitalDev: Digital) {
    this.digitalDev = digitalDev;
  }


  async setup(pin: number, pinMode: PinMode) {
    return this.digitalDev.setup(pin, pinMode);
  }

  read(pin: number): Promise<boolean> {
    return this.digitalDev.read(pin);
  }

  /**
   * Write to output pin
   */
  write(pin: number, level: boolean): Promise<void> {
    // TODO: добавить проверку direction пина чтобы ругаться
    // if (!this.outputPins[pin]) {
    //   throw new Error(`Can't set level. The local digital gpio GPIO "${pin}" wasn't set up as an output pin.`);
    // }

    return this.digitalDev.write(pin, level);
  }

  /**
   * Listen to interruption of input pin
   */
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    // if (!this.inputPins[pin]) {
    //   throw new Error(`Can't add listener. The local digital GPIO pin "${pin}" wasn't set up as an input pin.`);
    // }

    return this.digitalDev.setWatch(pin, handler, debounce, edge);
  }

  clearWatch(id: number): void {
    this.digitalDev.clearWatch(id);
  }

  clearAllWatches() {
    this.digitalDev.clearAllWatches();
  }

}


export default class Factory extends DriverBase<DigitalLocalDriverProps> {
  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digital = getDriverDep('Digital.dev');
  }

  getInstance(): DigitalLocalDriver {
    return new DigitalLocalDriver(this.depsInstances.digital as Digital);
  }
}
