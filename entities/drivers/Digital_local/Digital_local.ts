import DigitalIo, {
  DigitalIo,
  Edge,
  WatchHandler,
  DigitalInputMode,
} from 'system/interfaces/io/DigitalIo';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';


export class DigitalLocal extends DriverBase implements DigitalIo {
  private get digitalDev(): DigitalIo {
    return this.depsInstances.digitalDev as DigitalIo;
  }


  init = async () => {
    this.depsInstances.digitalDev = this.context.getIo('Digital');
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
  setWatch(pin: number, handler: WatchHandler): Promise<number> {
    // TODO: review
    return this.digitalDev.setWatch(pin, handler);
  }

  clearWatch(id: number): Promise<void> {
    return this.digitalDev.clearWatch(id);
  }

  clearAllWatches(): Promise<void> {
    return this.digitalDev.clearAllWatches();
  }

}


export default class Factory extends DriverFactoryBase<DigitalLocal> {
  protected SubDriverClass = DigitalLocal;
  // always return the same instance
  protected instanceId = () => 'same';
}
