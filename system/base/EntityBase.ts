import EntityDefinition from '../interfaces/EntityDefinition';
import ManifestBase from '../interfaces/ManifestBase';
import Context from '../Context';
import LogPublisher from '../LogPublisher';
import HostConfig from '../interfaces/HostConfig';
import IoItem from '../interfaces/IoItem';
import DriverBase from './DriverBase';
import ServiceManifest from '../interfaces/ServiceManifest';


interface KindOfDriver {
  getInstance(instanceProps?: {[index: string]: any}): Promise<any>;
  [index: string]: any;
}

export type GetDriverDep = (driverName: string) => KindOfDriver;


export default class EntityBase<Props = {}> {
  readonly context: Context;
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  // destroy method for entity
  destroy?: () => Promise<void>;

  // get api(): Api {
  //   return this.system.api;
  // }
  // get events(): IndexedEventEmitter {
  //   return this.system.events;
  // }
  get log(): LogPublisher {
    return this.context.log;
  }
  get config(): HostConfig {
    return this.context.config;
  }

  // you can store there drivers instances if need
  protected depsInstances: {[index: string]: any} = {};
  // better place to instantiate dependencies if need
  protected willInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // init process
  protected doInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // it calls after init. Better place to setup listeners
  protected didInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // it will be risen after devices init
  protected devicesDidInit?: () => Promise<void>;
  // it will be risen after app init
  protected appDidInit?: () => Promise<void>;
  // If you have props you can validate it in this method
  protected validateProps?: (props: Props) => string | undefined;


  protected get definition(): EntityDefinition {
    const {id, className, props} = this;

    return {
      id,
      className,
      props,
    };
  }


  constructor(context: Context, definition: EntityDefinition) {
    this.context = context;
    this.id = definition.id;
    this.className = definition.className;
    this.props = definition.props as Props;
  }

  async init() {
    if (this.validateProps) {
      const errorMsg: string | undefined = this.validateProps(this.props);

      if (errorMsg) throw new Error(errorMsg);
    }

    const getDriverDep: GetDriverDep = this.getDriverDepCb();

    if (this.devicesDidInit) {
      // TODO: будет не синхронно
      this.context.onDevicesInit(async () => {
        try {
          this.devicesDidInit && await this.devicesDidInit();
        }
        catch (err) {
          this.log.error(err);
        }
      });
    }

    if (this.appDidInit) {
      // TODO: будет не синхронно
      this.context.onAppInit(async () => {
        try {
          this.appDidInit && await this.appDidInit();
        }
        catch (err) {
          this.log.error(err);
        }
      });
    }

    if (this.willInit) await this.willInit(getDriverDep);
    if (this.doInit) await this.doInit(getDriverDep);

    // TODO: call on event which is risen after entities of the same type are inited
    // not critical error
    if (this.didInit) {
      //this.env.system.afterEntitiesInit()
      try {
        await this.didInit(getDriverDep);
      }
      catch (err) {
        this.log.error(err);
      }
    }
  }

  async doDestroy() {
    if (this.destroy) await this.destroy();
  }


  getIo<T extends IoItem>(shortDevName: string): T {
    return this.context.system.ioManager.getIo<T>(shortDevName);
  }

  getDriver<T extends DriverBase>(driverName: string): T {
    return this.context.system.driversManager.getDriver<T>(driverName);
  }

  /**
   * Load manifest of this entity
   */
  protected async getManifest<T extends ManifestBase>(): Promise<T> {
    return this.context.system.envSet.loadManifest<ServiceManifest>('services', className);
    //return this.loadManifest(this.className) as Promise<T>;
  }

  /**
   * Print errors to console of async functions
   */
  protected wrapErrors(cb: (...cbArgs: any[]) => Promise<void>): (...args: any[]) => void {
    return (...args: any[]) => {
      try {
        cb(...args)
          .catch(this.log.error);
      }
      catch (err) {
        this.log.error(err);
      }
    };
  }


  private getDriverDepCb(): GetDriverDep {
    return (driverName: string): KindOfDriver => {
      return this.getDriver(driverName) as any;
    };
  }

}