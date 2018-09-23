const _includes = require('lodash/includes');

import EntityDefinition from '../interfaces/EntityDefinition';
import ManifestBase from '../interfaces/ManifestBase';
import Env from '../interfaces/Env';
import DriverInstance from '../interfaces/DriverInstance';
import DeviceManifest from '../interfaces/DeviceManifest';


export type GetDriverDep = (driverName: string) => DriverInstance;


// TODO: Props сделать необязательным

export default class EntityBase<Props> {
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  protected readonly env: Env;
  // you can store there drivers instances if need
  protected depsInstances: {[index: string]: DriverInstance} = {};
  // better place to instantiate dependencies if need
  protected willInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // init process
  protected doInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // it calls after init. Better place to setup listeners
  protected didInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // If you have props you can validate it in this method
  protected validateProps?: (props: Props) => string | undefined;
  protected destroy?: () => void;

  protected get definition(): EntityDefinition {
    const {id, className, props} = this;

    return {
      id,
      className,
      props,
    };
  }


  constructor(definition: EntityDefinition, env: Env) {
    this.env = env;
    this.id = definition.id;
    this.className = definition.className;
    this.props = definition.props as Props;
  }

  async init() {
    if (this.validateProps) {
      const errorMsg: string | undefined = this.validateProps(this.props);

      if (errorMsg) throw new Error(errorMsg);
    }

    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();
    const getDriverDep: GetDriverDep = (driverName: string): DriverInstance => {
      if (!_includes(manifest.drivers, driverName)) {
        throw new Error(`Can't find driver "${driverName}"`);
      }

      return this.env.getDriver(driverName);
    };

    if (this.willInit) await this.willInit(getDriverDep);
    if (this.doInit) await this.doInit(getDriverDep);
    if (this.didInit) await this.didInit(getDriverDep);
  }

  /**
   * Load manifest of this entity
   */
  protected async getManifest<T extends ManifestBase>(): Promise<T> {
    return await this.env.loadManifest(this.className) as T;
  }

}
