import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {omitObj} from 'system/lib/objects';
import {DigitalSubDriver} from 'system/interfaces/io/DigitalIo';

import DigitalBaseProps from './interfaces/DigitalBaseProps';


/*
initialLevel:
  type: boolean
  default: false

### DigitalPin base props
pin:
  type: number
  required: true
source:
  type: string
  default: 'local'
expander:
  type: string

 */


export interface DigitalPinOutputProps extends DigitalBaseProps {
  initialLevel: boolean;
}

export function combineDriverName(source: string) {
  return `Digital_${source}`;
}


/**
 * This is middleware driver which allows acting with low level drivers as an output pin.
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinOutput extends DriverBase<DigitalPinOutputProps> {
  private get source(): DigitalSubDriver {
    return this.depsInstances.source;
  }


  init = async () => {
    if (!this.props.source) throw new Error(`DigitalPinOutput: No source: ${JSON.stringify(this.props)}`);

    const driverName = combineDriverName(this.props.source);

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


export default class Factory extends DriverFactoryBase<DigitalPinOutput, DigitalPinOutputProps> {
  protected SubDriverClass = DigitalPinOutput;
  protected instanceId = (props: DigitalPinOutputProps): string => {
    const baseId = `${props.source}-${props.pin}`;

    if (!props.source) return baseId;

    const driver: any = this.context.getDriver(combineDriverName(props.source));

    if (driver.generateUniqId) {
      return `${baseId}-${driver.generateUniqId(props)}`;
    }
    else {
      return baseId;
    }
  }
}
