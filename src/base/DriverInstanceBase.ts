import type {DriverContext} from '../system/context/DriverContext.js'
import type DriverFactoryBase from './DriverFactoryBase.js'


export interface DriverInstanceParams<
  Props extends Record<string, any> = Record<string, any>,
  Driver = DriverFactoryBase<DriverInstanceBase, Props>
> {
  ctx: DriverContext
  instanceId: string
  // base driver instance
  driver: Driver
  // instance props
  props: Props
  cfg?: Record<string, any>
}


export default class DriverInstanceBase<
  Props extends {[index: string]: any} = any,
  Driver extends DriverFactoryBase<any, Props> = DriverFactoryBase<any, Props>
> {
  readonly params: DriverInstanceParams<Props, Driver>

  get instanceId(): string {
    return this.params.instanceId
  }

  protected get ctx(): DriverContext {
    return this.params.ctx
  }

  get props(): Props {
    return this.params.props
  }

  get cfg(): Record<string, any> | undefined {
    return this.params.cfg
  }

  // If you have props you can validate it in this method
  protected validateProps?: (props: Props) => string | undefined;


  constructor(params: DriverInstanceParams<Props, Driver>) {
    this.params = params

    // if (this.driversDidInit) this.ctx.onDriversInit(this.driversDidInit.bind(this))
    // if (this.servicesDidInit) this.ctx.onServicesInit(this.servicesDidInit.bind(this))
    // if (this.appDidInit) this.ctx.onAppInit(this.appDidInit.bind(this))
  }

  init?(): Promise<void>

  // TODO: зачем отдельный метод?
  // destroy logic of instance
  $doDestroy?(): Promise<void>
  // define this method to destroy entity when system is destroying.
  // Don't call this method in other cases.
  async destroy(): Promise<void> {
    await this.params.driver.destroyInstance(this.params.instanceId)
  }

  // // it will be called after all the entities of entityType have been inited
  // protected driversDidInit?(): Promise<void>
  // protected servicesDidInit?(): Promise<void>
  // // it will be risen after app init or immediately if app was inited
  // protected appDidInit?(): Promise<void>

}


// /**
//  * Print errors to console of async functions
//  */
// protected wrapErrors(cb: (...cbArgs: any[]) => Promise<void>): (...args: any[]) => void {
//   return (...args: any[]) => {
//     try {
//       cb(...args)
//         .catch(this.ctx.log.error)
//     }
//     catch (err) {
//       this.ctx.log.error(err)
//     }
//   };
// }

// private doPropsValidation() {
//   if (this.validateProps) {
//     const errorMsg: string | undefined = this.validateProps(this.props)
//
//     if (errorMsg) throw new Error(errorMsg)
//   }
// }
