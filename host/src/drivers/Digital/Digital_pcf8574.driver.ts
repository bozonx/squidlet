import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
import DriverBase from '../../app/entities/DriverBase';


interface DigitalPcf8574DriverProps extends EntityProps {
  bus: number;
  address: number;
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> {
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

  // TODO: сразу валидировать address and bus
  // TODO: инстанс будет на совмещенном параметре address and bus

  protected instanceIdName: string = 'i2c';
  protected DriverClass = DigitalPcf8574Driver;
}
