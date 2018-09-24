import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {PinMode} from '../../app/interfaces/dev/Digital';


interface DigitalPcf8574DriverProps extends EntityProps {
  bus: number;
  address: number;
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> implements Digital {
  getPinMode(pin: number): PinMode | undefined {
    // TODO: !!!
  }

  async read(pin: number): Promise<boolean> {
    // TODO: !!!
  }

  /**
   * Set level to output pin
   */
  async write(pin: number, level: boolean): Promise<void> {
    // TODO: если пин сконфигурирован на input - ругаться
    // TODO: !!!
  }

  /**
   * Listen to interruption of input pin
   */
  addListener(handler: GpioDigitalDriverHandler): void {
    // TODO: если пин сконфигурирован на output - ругаться

    // TODO: !!!
  }

  removeListener(handler: GpioDigitalDriverHandler): void {
    // TODO: !!!
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalPcf8574Driver, DigitalPcf8574DriverProps> {
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
