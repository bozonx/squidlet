import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';


export class DigitalLocalDriver implements Digital {
  private readonly digitalDev: Digital;

  constructor(digitalDev: Digital) {
    this.digitalDev = digitalDev;
  }


  async setup(pin: number, pinMode: PinMode) {
    return this.digitalDev.setup(pin, pinMode);
  }

  getPinMode(pin: number): PinMode | undefined {
    return this.digitalDev.getPinMode(pin);
  }

  read(pin: number): Promise<boolean> {
    return this.digitalDev.read(pin);
  }

  /**
   * Write to output pin
   */
  write(pin: number, level: boolean): Promise<void> {
    const pinMode: PinMode | undefined = this.getPinMode(pin);

    if (!pinMode || !pinMode.match(/output/)) {
      throw new Error(`Can't set level. The local digital gpio GPIO "${pin}" wasn't set up as an output pin.`);
    }

    return this.digitalDev.write(pin, level);
  }

  /**
   * Listen to interruption of input pin
   */
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    const pinMode: PinMode | undefined = this.getPinMode(pin);

    if (!pinMode || !pinMode.match(/input/)) {
      throw new Error(`Can't add listener. The local digital GPIO pin "${pin}" wasn't set up as an input pin.`);
    }

    return this.digitalDev.setWatch(pin, handler, debounce, edge);
  }

  clearWatch(id: number): void {
    this.digitalDev.clearWatch(id);
  }

  clearAllWatches() {
    this.digitalDev.clearAllWatches();
  }

}


export default class Factory extends DriverBase {
  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digital = getDriverDep('Digital.dev');
  }

  getInstance(): DigitalLocalDriver {
    return new DigitalLocalDriver(this.depsInstances.digital as Digital);
  }
}
