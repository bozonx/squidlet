import Context from '../system/Context'
import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js'
import LogPublisher from '../../../__old/system/LogPublisher'
import HostConfig from '../../../__old/system/interfaces/HostConfig'


export interface DriverInstanceParams<Props, Driver = DriverFactoryBase<Props>> {
  instanceId: string
  // instance props
  props: Props
  // base driver instance
  driver: Driver
  [index: string]: any
}


export default abstract class DriverInstanceBase<
  Props = Record<string, any>,
  Driver extends DriverFactoryBase<Props, any> = any
> {
  //abstract readonly entityType: EntityType
  readonly context: Context
  readonly params: DriverInstanceParams<Props, Driver>

  get instanceId(): string {
    return this.params.instanceId
  }
  get props(): Props {
    return this.params.props
  }

  protected get log(): LogPublisher {
    return this.context.log
  }
  protected get config(): HostConfig {
    return this.context.config
  }

  // If you have props you can validate it in this method
  protected validateProps?: (props: Props) => string | undefined;


  constructor(context: Context, params: DriverInstanceParams<Props, Driver>) {
    this.context = context
    this.params = params

    this.doPropsValidation()

    if (this.driversDidInit) this.context.onDriversInit(this.driversDidInit.bind(this))
    if (this.servicesDidInit) this.context.onServicesInit(this.servicesDidInit.bind(this))
    if (this.appDidInit) this.context.onAppInit(this.appDidInit.bind(this))
  }

  abstract init?(): Promise<void>
  // destroy logic of instance
  abstract $doDestroy(): Promise<void>
  // define this method to destroy entity when system is destroying.
  // Don't call this method in other cases.
  destroy = async () => {
    await this.params.driver.destroyInstance(this.params.instanceId)
  }

  // it will be called after all the entities of entityType have been inited
  protected driversDidInit?(): Promise<void>
  protected servicesDidInit?(): Promise<void>
  // it will be risen after app init or immediately if app was inited
  protected appDidInit?(): Promise<void>

  /**
   * Print errors to console of async functions
   */
  protected wrapErrors(cb: (...cbArgs: any[]) => Promise<void>): (...args: any[]) => void {
    return (...args: any[]) => {
      try {
        cb(...args)
          .catch(this.log.error)
      }
      catch (err) {
        this.log.error(err)
      }
    };
  }


  private doPropsValidation() {
    if (this.validateProps) {
      const errorMsg: string | undefined = this.validateProps(this.props)

      if (errorMsg) throw new Error(errorMsg)
    }
  }

}
