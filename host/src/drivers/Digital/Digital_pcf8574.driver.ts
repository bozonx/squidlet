import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {PCF8574Driver} from '../Pcf8574/Pcf8574.driver';


interface DigitalPcf8574DriverProps extends EntityProps {
  bus: number;
  address: number;
  //outputInitial: boolean[];
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> implements Digital {
  private get expander(): PCF8574Driver {
    return this.depsInstances.expander as PCF8574Driver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
      .getInstance();
  }

  async setup(pin: number, pinMode: PinMode): Promise<void> {

  }

  getPinMode(pin: number): PinMode | undefined {
    // TODO: !!!
  }

  async read(pin: number): Promise<boolean> {
    // TODO: !!!
  }

  /**
   * Set level to output pin
   */
  async write(pin: number, value: boolean): Promise<void> {
    // TODO: если пин сконфигурирован на input - ругаться
    // TODO: !!!
  }

  /**
   * Listen to interruption of input pin
   */
  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    // TODO: если пин сконфигурирован на output - ругаться

    // TODO: !!!
  }

  clearWatch(id: number): void {
    // TODO: !!!
  }

  clearAllWatches(): void {

  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalPcf8574Driver, DigitalPcf8574DriverProps> {

  // TODO: инстансы по одному address and bus - сохранять и выдавать одни и теже

  protected combinedInstanceIdName = (instanceProps?: {[index: string]: any}): string => {

    // TODO: использовать правила валидации
    // TODO: может использовать какую-то автоматическую валидацию props

    if (!instanceProps) {
      throw new Error(`You have to specify props for instance of driver DigitalPcf8574`);
    }
    else if (!Number.isInteger(instanceProps.bus)) {
      throw new Error(`The bus param has to be a number of driver DigitalPcf8574`);
    }
    else if (!Number.isInteger(instanceProps.address)) {
      throw new Error(`The address param has to be a number of driver DigitalPcf8574`);
    }

    return `${instanceProps.bus}-${instanceProps.address}`;
  }

  protected DriverClass = DigitalPcf8574Driver;
}
