import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {omitObj} from 'system/lib/objects';
import {DigitalSubDriver} from 'system/interfaces/io/DigitalIo';

import DigitalBaseProps from './interfaces/DigitalBaseProps';


export interface DigitalPinOutputProps extends DigitalBaseProps {
  initialLevel: boolean;
}


/**
 * This is middleware driver which allows acting with low level drivers as an output pin.
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinOutput extends DriverBase<DigitalPinOutputProps> {
  private get source(): DigitalSubDriver {
    return this.depsInstances.source;
  }


  protected init = async () => {
    const driverName = `Digital_${this.props.source}`;

    this.depsInstances.source = await this.context.getSubDriver(
      driverName,
      omitObj(
        this.props,
        'initialLevel',
        'pin',
        'source'
      )
    );

    // TODO: setup pin after drivers and devices have been initialized ???
    // setup and set initial level
    this.source.setupOutput(this.props.pin, this.props.initialLevel)
      .catch((err) => {
        this.log.error(
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
