import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
import {GpioDigitalDriverHandler} from './interfaces/GpioDigitalDriver';


interface DigitalPcf8574DriverProps extends EntityProps {

}


export class DigitalPcf8574Driver {
  async getLevel(pin: number): Promise<boolean> {
    // TODO: !!!
  }

  /**
   * Set level to output pin
   */
  async setLevel(pin: number, level: boolean): Promise<void> {
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

  // TODO: i2c and bus

  protected instanceIdName: string = 'i2c';
  protected DriverClass = DigitalPcf8574Driver;
}
