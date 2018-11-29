import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';


export class DigitalLocalDriver extends DriverBase implements Digital {
  private get digitalDev(): Digital {
    return this.depsInstances.digitalDev as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalDev = await getDriverDep('Digital.dev');
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
    return this.digitalDev.write(pin, level);
  }

  /**
   * Listen to interruption of input pin
   */
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    return this.digitalDev.setWatch(pin, handler, debounce, edge);
  }

  clearWatch(id: number): void {
    this.digitalDev.clearWatch(id);
  }

  clearAllWatches() {
    this.digitalDev.clearAllWatches();
  }

}


export default class Factory extends DriverFactoryBase<DigitalLocalDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalLocalDriver;
}
