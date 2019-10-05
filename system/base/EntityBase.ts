import EntityDefinition from '../interfaces/EntityDefinition';
import ManifestBase from '../interfaces/ManifestBase';
import Context from '../Context';
import LogPublisher from '../LogPublisher';
import HostConfig from '../interfaces/HostConfig';
import IoItem from '../interfaces/IoItem';
import DriverBase from './DriverBase';
import {EntityType} from '../interfaces/EntityTypes';


interface KindOfDriver {
  getInstance(instanceProps?: {[index: string]: any}): Promise<any>;
  [index: string]: any;
}

export type GetDriverDep = (driverName: string) => KindOfDriver;


export default abstract class EntityBase<Props = {}, ManifestType extends ManifestBase = ManifestBase> {
  abstract readonly entityType: EntityType;
  readonly context: Context;
  readonly definition: EntityDefinition;
  // destroy method for entity
  destroy?: () => Promise<void>;

  get id(): string {
    return this.definition.id;
  }
  get className(): string {
    return this.definition.className;
  }
  get props(): Props {
    return this.definition.props as Props;
  }
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
  // TODO: maybe remove ????
  // it calls after init. Better place to setup listeners
  //protected didInit?: (getDriverDep: GetDriverDep) => Promise<void>;

  // TODO: maybe make separate did drivers and services init????
  // it will be called after all the entities of entityType have been inited
  protected didGroupInit?: (getDriverDep: GetDriverDep) => Promise<void>;
  // it will be risen after devices init or immediately if devices were inited
  protected devicesDidInit?: () => Promise<void>;
  // it will be risen after app init or immediately if app was inited
  protected appDidInit?: () => Promise<void>;
  // If you have props you can validate it in this method
  protected validateProps?: (props: Props) => string | undefined;

  // TODO: does it really need???
  // protected get definition(): EntityDefinition {
  //   const {id, className, props} = this;
  //
  //   return {
  //     id,
  //     className,
  //     props,
  //   };
  // }


  constructor(context: Context, definition: EntityDefinition) {
    this.context = context;
    this.definition = definition;
  }

  async init() {
    if (this.validateProps) {
      const errorMsg: string | undefined = this.validateProps(this.props);

      if (errorMsg) throw new Error(errorMsg);
    }

    await this.addLifeCycleListeners();
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
  protected async getManifest(): Promise<ManifestType> {
    return this.context.system.envSet.loadManifest<ManifestType>(this.entityType, this.className);
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

  private async addLifeCycleListeners() {
    const getDriverDep: GetDriverDep = this.getDriverDepCb();

    // TODO: add on drivers and on services init
    if (this.devicesDidInit) this.context.onDevicesInit(this.devicesDidInit);
    if (this.appDidInit) this.context.onAppInit(this.appDidInit);
    if (this.willInit) await this.willInit(getDriverDep);
    if (this.doInit) await this.doInit(getDriverDep);

    // // not critical error
    // if (this.didInit) {
    //   try {
    //     await this.didInit(getDriverDep);
    //   }
    //   catch (err) {
    //     this.log.error(err);
    //   }
    // }
  }

}
