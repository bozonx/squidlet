import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverEnv from '../../app/entities/DriverEnv';
import {BinaryLevel} from '../../app/CommonTypes';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


type Handler = (level: BinaryLevel) => void;

interface GpioOutputDriverProps extends EntityProps {
  // TODO: !!!!
}


export class DigitalOutputDriver {
  private readonly props: GpioOutputDriverProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: GpioOutputDriverProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

  async getLevel(): Promise<BinaryLevel> {
    // TODO: add
    // TODO: трансформировать левел

    return true;
  }

  async setLevel(newLevel: BinaryLevel): Promise<void> {
    // TODO: add
    // TODO: трансформировать левел

  }

  onChange(handler: Handler): void {
    // TODO: add
    // TODO: трансформировать левел
  }

  removeListener(handler: Handler): void {
    // TODO: add
  }

}


export default class GpioOutputFactory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: GpioOutputDriverProps,
      env: DriverEnv,
    ): DigitalOutputDriver } = DigitalOutputDriver;
  private instances: {[index: string]: DigitalOutputDriver} = {};

  getInstance(deviceParams: {[index: string]: any}): DigitalOutputDriver {

    // TODO: validate params
    // TODO: validate specific for certain driver params
    // TODO: make uniq string for driver - raspberry-1-5a

    const instanceId = '1';

    if (!this.instances[instanceId]) {
      this.instances[instanceId] = super.getInstance(instanceId) as DigitalOutputDriver;
    }

    return this.instances[instanceId];
  }

}
