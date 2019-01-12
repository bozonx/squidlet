import EntityDefinition from '../interfaces/EntityDefinition';
import ManifestBase from '../interfaces/ManifestBase';
import Env from '../interfaces/Env';
import DriverInstance from '../interfaces/DriverInstance';
import DeviceManifest from '../interfaces/DeviceManifest';


export type GetDriverDep = (driverName: string) => DriverInstance;


export default class EntityBase<Props = {}> {
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
  // it will be risen after app init
  protected appDidInit?: () => Promise<void>;
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
      if (!manifest.drivers || !manifest.drivers.includes(driverName)) {
        throw new Error(`Can't find driver "${driverName}"`);
      }

      return this.env.getDriver(driverName);
    };
    // const getDev: GetDriverDep = (devName: string): DriverInstance => {
    //   return this.env.getDev(devName);
    // };

    if (this.appDidInit) {
      this.env.system.onAppInit(async () => {
        try {
          this.appDidInit && await this.appDidInit();
        }
        catch (err) {
          this.env.log.error(err);
        }
      });
    }

    if (this.willInit) await this.willInit(getDriverDep);
    if (this.doInit) await this.doInit(getDriverDep);
    // not critical error
    if (this.didInit) {
      try {
        await this.didInit(getDriverDep);
      }
      catch (err) {
        this.env.log.error(err);
      }
    }
  }

  /**
   * Load manifest of this entity
   */
  protected async getManifest<T extends ManifestBase>(): Promise<T> {
    return await this.env.loadManifest(this.className) as T;
  }

}
