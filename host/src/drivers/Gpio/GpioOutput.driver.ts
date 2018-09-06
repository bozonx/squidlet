import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/DriverFactoryBase';
import DriverEnv from '../../app/DriverEnv';
import {BinaryLevel} from '../../app/CommonTypes';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
//import DriverProps from '../../app/interfaces/DriverProps';


type Handler = (level: BinaryLevel) => void;

interface GpioOutputDriverProps extends EntityProps {
  // TODO: !!!!
}


export class GpioOutputDriver {
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
    ): GpioOutputDriver } = GpioOutputDriver;
  private instances: {[index: string]: GpioOutputDriver} = {};

  getInstance(deviceParams: {[index: string]: any}): GpioOutputDriver {

    // TODO: validate params
    // TODO: validate specific for certain driver params
    // TODO: make uniq string for driver - raspberry-1-5a

    const instanceId = '1';

    if (!this.instances[instanceId]) {
      this.instances[instanceId] = super.getInstance(instanceId) as GpioOutputDriver;
    }

    return this.instances[instanceId];
  }

}
