import DriverFactoryBase from 'host/baseDrivers/DriverFactoryBase';
import DriverBase from 'host/baseDrivers/DriverBase';
import {GetDriverDep} from 'host/entities/EntityBase';
import {omit} from 'host/helpers/lodashLike';
import {DigitalSubDriver} from 'host/interfaces/dev/DigitalDev';

import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {resolveDriverName} from './digitalHelpers';


export interface DigitalPinOutputProps extends DigitalBaseProps {
  initialLevel: boolean;
}


/**
 * This is middleware driver which allows acting with low level drivers as an output pin.
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinOutput extends DriverBase<DigitalPinOutputProps> {
  private get source(): DigitalSubDriver {
    return this.depsInstances.source as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.source);

    this.depsInstances.source = await getDriverDep(driverName)
      .getInstance(omit(this.props, 'initialLevel', 'pin', 'source'));
  }

  // setup pin after drivers and devices have been initialized
  protected didInit = async () => {
    // setup and set initial level
    this.source.setupOutput(this.props.pin, this.props.initialLevel)
      .catch((err) => {
        this.env.log.error(
          `DigitalPinOutputDriver: Can't setup pin. ` +
          `"${JSON.stringify(this.props)}": ${err.toString()}`
        );
      });
  }


  async getPinMode(): Promise<'output'> {
    return 'output';
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


export default class Factory extends DriverFactoryBase<DigitalPinOutput> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPinOutput;
  // TODO: source + pin + спросить адрес у нижележащего драйвера
}
