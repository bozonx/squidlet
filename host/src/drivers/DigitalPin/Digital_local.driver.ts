import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';


export class DigitalLocalDriver extends DriverBase implements Digital {
  private get digitalDev(): Digital {
    return this.depsInstances.digitalDev as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    //this.depsInstances.digitalDev = await getDriverDep('Digital.dev');
    this.depsInstances.digitalDev = this.env.getDev('Digital');
  }


  setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    return this.digitalDev.setup(pin, pinMode, outputInitialValue);
  }

  getPinMode(pin: number): Promise<PinMode | undefined> {
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
  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
    return this.digitalDev.setWatch(pin, handler, debounce, edge);
  }

  async clearWatch(id: number): Promise<void> {
    return this.digitalDev.clearWatch(id);
  }

  async clearAllWatches(): Promise<void> {
    return this.digitalDev.clearAllWatches();
  }

}


export default class Factory extends DriverFactoryBase<DigitalLocalDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalLocalDriver;
}
