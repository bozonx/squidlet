import DigitalIo, {
  DigitalSubDriver,
  Edge,
  WatchHandler,
  DigitalInputMode
} from 'system/interfaces/io/DigitalIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';


export class DigitalLocal extends DriverBase implements DigitalSubDriver {
  private get digitalDev(): DigitalIo {
    return this.depsInstances.digitalDev as DigitalIo;
  }


  protected willInit = async () => {
    this.depsInstances.digitalDev = this.getIo('Digital');
  }


  setupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void> {
    return this.digitalDev.setupInput(pin, inputMode, debounce, edge);
  }

  setupOutput(pin: number, initialValue: boolean): Promise<void> {
    return this.digitalDev.setupOutput(pin, initialValue);
  }

  // getPinMode(pin: number): Promise<DigitalPinMode | undefined> {
  //   return this.digitalDev.getPinMode(pin);
  // }

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
  async setWatch(pin: number, handler: WatchHandler): Promise<number> {
    // TODO: review
    return this.digitalDev.setWatch(pin, handler);
  }

  async clearWatch(id: number): Promise<void> {
    return this.digitalDev.clearWatch(id);
  }

  async clearAllWatches(): Promise<void> {
    return this.digitalDev.clearAllWatches();
  }

}


export default class Factory extends DriverFactoryBase<DigitalLocal> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalLocal;
}
