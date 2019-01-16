import GpioDigitalDriver from './interfaces/GpioDigitalDriver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {resolveDriverName} from './digitalHelpers';
import {omit} from '../../helpers/lodashLike';


export interface DigitalPinOutputDriverProps extends DigitalBaseProps {
  initialLevel: boolean;
}


/**
 * This is middleware driver which allows acting with low level drivers as an output pin.
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinOutputDriver extends DriverBase<DigitalPinOutputDriverProps> {
  private get source(): GpioDigitalDriver {
    return this.depsInstances.gpio as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.source);

    this.depsInstances.source = await getDriverDep(driverName)
      .getInstance(omit(this.props, 'initialLevel', 'pin', 'source'));
  }

  // setup pin after drivers and devices have been initialized
  protected devicesDidInit = async () => {
    // setup and set initial level
    this.source.setup(this.props.pin, 'output', this.props.initialLevel)
      .catch((err) => {
        this.env.system.log.error(
          `DigitalPinOutputDriver: Can't setup pin. ` +
          `"${JSON.stringify(this.props)}": ${err.toString()}`
        );
      });
  }


  /**
   * Get current level of pin.
   */
  read(): Promise<boolean> {
    return this.source.read(this.props.pin);
  }

  async write(newLevel: boolean): Promise<void> {
    if (typeof newLevel !== 'boolean') throw new Error(`Invalid type of level`);

    return this.source.write(this.props.pin, newLevel);
  }


  protected validateProps = (): string | undefined => {
    // TODO: validate params, props.driver, specific for certain driver params
    return;
  }

}


export default class Factory extends DriverFactoryBase<DigitalPinOutputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPinOutputDriver;
  // TODO: source + pin + спросить адрес у нижележащего драйвера
}
