import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverEnv from '../../app/entities/DriverEnv';
import {BinaryLevel} from '../../app/CommonTypes';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


type Handler = (level: BinaryLevel) => void;


// TODO: add watchOnce
// TODO: инициализировать output значение - 1 или 0

export class DigitalInputDriver {
  private readonly props: EntityProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: EntityProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

  async getLevel(): Promise<BinaryLevel> {
    // TODO: add
    // TODO: трансформировать левел

    return true;
  }

  onChange(handler: Handler): void {
    // TODO: add
    // TODO: трансформировать левел
  }

  removeListener(handler: Handler): void {
    // TODO: add
  }

}


export default class GpioInputFactory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
    ): DigitalInputDriver } = DigitalInputDriver;
  private instances: {[index: string]: DigitalInputDriver} = {};

  getInstance(props: EntityProps): DigitalInputDriver {

    // TODO: validate params
    // TODO: validate specific for certain driver params
    // TODO: make uniq string for driver - raspberry-1-5a

    const instanceId = '1';

    if (!this.instances[instanceId]) {
      this.instances[instanceId] = super.getInstance(instanceId) as DigitalInputDriver;
    }

    return this.instances[instanceId];
  }

}
