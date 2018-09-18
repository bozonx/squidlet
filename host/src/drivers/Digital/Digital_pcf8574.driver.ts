import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


interface DigitalPcf8574DriverProps extends EntityProps {

}


export class DigitalPcf8574Driver {

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalPcf8574Driver, DigitalPcf8574DriverProps> {
  protected instanceIdName: string = 'i2c';
  protected DriverClass = DigitalPcf8574Driver;
}
