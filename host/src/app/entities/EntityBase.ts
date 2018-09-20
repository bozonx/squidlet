import EntityDefinition from '../interfaces/EntityDefinition';
import ManifestBase from '../interfaces/ManifestBase';
import Env from '../interfaces/Env';
import DriverInstance from '../interfaces/DriverInstance';
import DeviceManifest from '../interfaces/DeviceManifest';
import DriverFactory from '../interfaces/DriverFactory';


// export interface DriversInstances {
//   [index: string]: DriverInstance;
// }


export default class EntityBase<Props> {
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  protected readonly env: Env;
  protected depsInstances: {[index: string]: DriverInstance} = {};
  // it calls before init propcess but after init dependencies
  protected willInit?: (depsDrivers: DepsDrivers) => Promise<void>;
  // init process
  protected doInit?: (depsDrivers: DepsDrivers) => Promise<void>;
  // it calls after device init, status and config init have been finished
  protected didInit?: (depsDrivers: DepsDrivers) => Promise<void>;
  protected destroy?: () => void;
  protected driversInstances: {[index: string]: DriverInstance} = {};

  // /**
  //  * Get driver which is dependency of entity
  //  */
  // protected get drivers(): DriversInstances {
  //   return this.driversInstances;
  // }

  constructor(definition: EntityDefinition, env: Env) {
    this.env = env;
    this.id = definition.id;
    this.className = definition.className;
    this.props = definition.props as Props;
  }

  async init() {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();
    const depsDrivers: DepsDrivers = await this.initDependencies(manifest);

    if (this.willInit) await this.willInit(depsDrivers);
    if (this.doInit) await this.doInit(depsDrivers);
    if (this.didInit) await this.didInit(depsDrivers);
  }

  /**
   * Get driver dependency.
   * You have to shore that dependency is exists.
   * @param driverName
   */
  protected getDep(driverName: string): DriverFactory<DriverInstance> {
    if (!this.driversInstances[driverName]) {
      throw new Error(`Can't find driver "${driverName}"`);
    }

    return this.driversInstances[driverName] as DriverFactory<DriverInstance>;
  }

  protected async initDependencies(manifest: ManifestBase): Promise<DepsDrivers> {
    //if (!manifest.drivers) return;
    const result: DepsDrivers = {};

    for (let driverName of manifest.drivers || []) {
      result[driverName] = this.env.getDriver(driverName);
    }

    return result;
  }

  /**
   * Load manifest of this entity
   */
  protected async getManifest<T extends ManifestBase>(): Promise<T> {
    return await this.env.loadManifest(this.className) as T;
  }

}
