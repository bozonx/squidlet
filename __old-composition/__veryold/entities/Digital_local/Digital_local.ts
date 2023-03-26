import DigitalIo, {
  Edge,
  ChangeHandler,
  DigitalInputMode,
} from 'interfaces/io/DigitalIo';
import DriverBase from 'base/DriverBase';
import SourceDriverFactoryBase from 'lib/base/digital/SourceDriverFactoryBase';


export class DigitalLocal extends DriverBase implements DigitalIo {
  private get digitalDev(): DigitalIo {
    return this.depsInstances.digitalDev as DigitalIo;
  }


  init = async () => {
    this.depsInstances.digitalDev = this.context.getIo('Digital');
  }

  // TODO: после дестроя всех digital драйверов надо поидее сделать removeAllListeners()


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
  setWatch(pin: number, handler: ChangeHandler): Promise<number> {
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


export default class Factory extends SourceDriverFactoryBase<DigitalLocal> {
  protected SubDriverClass = DigitalLocal;
  // always return the same instance
  protected instanceId = () => 'same';

  generateUniqId(): string {
    return 'local';
  }
}
