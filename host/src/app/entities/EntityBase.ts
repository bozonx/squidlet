import EntityDefinition from '../interfaces/EntityDefinition';
import ManifestBase from '../interfaces/ManifestBase';
import Env from '../interfaces/Env';
import DriverInstance from '../interfaces/DriverInstance';
import DeviceManifest from '../interfaces/DeviceManifest';


// export interface DriversInstances {
//   [index: string]: DriverInstance;
// }


export default class EntityBase<Props> {
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  protected readonly env: Env;
  // it calls before init propcess but after init dependencies
  protected willInit?: () => Promise<void>;
  // init process
  protected doInit?: () => Promise<void>;
  // it calls after device init, status and config init have been finished
  protected didInit?: () => Promise<void>;
  protected destroy?: () => void;
  protected driversInstances: {[index: string]: DriverInstance} = {};

  // /**
  //  * Get driver which is dependency of device
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

    await this.initDependencies(manifest);

    if (this.willInit) await this.willInit();
    if (this.doInit) await this.doInit();
    if (this.didInit) await this.didInit();
  }

  /**
   * Get driver dependency.
   * You have to shore that dependency is exists.
   * @param driverName
   */
  protected getDriverDep<T>(driverName: string): T {
    if (!this.driversInstances[driverName]) {
      throw new Error(`Can't find driver "${driverName}"`);
    }

    return this.driversInstances[driverName] as T;
  }

  protected async initDependencies(manifest: ManifestBase): Promise<void> {
    if (!manifest.drivers) return;

    for (let driverName of manifest.drivers) {
      this.driversInstances[driverName] = this.env.getDriver(driverName);
    }
  }

  /**
   * Load manifest of this entity
   */
  protected async getManifest<T extends ManifestBase>(): Promise<T> {
    return await this.env.loadManifest(this.className) as T;
  }

}
