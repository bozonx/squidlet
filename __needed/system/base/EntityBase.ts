import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import EntityManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityManifest.js';
import Context from '../system/Context';
import LogPublisher from '../../../__old/system/LogPublisher';
import HostConfig from '../../../__old/system/interfaces/HostConfig';
import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';


// TODO: может просто расширить контекст

export default abstract class EntityBase<Props = {}, ManifestType extends EntityManifest = EntityManifest> {
  //abstract readonly entityType: EntityType
  readonly context: Context
  readonly definition: EntityDefinition

  get id(): string {
    return this.definition.id
  }
  get className(): string {
    return this.definition.className
  }
  get props(): Props {
    return this.definition.props as Props
  }

  protected get log(): LogPublisher {
    return this.context.log
  }
  protected get config(): HostConfig {
    return this.context.config
  }

  // If you have props you can validate it in this method
  protected validateProps?: (props: Props) => string | undefined;


  constructor(context: Context, definition: EntityDefinition) {
    this.context = context
    this.definition = definition

    this.doPropsValidation()

    if (this.driversDidInit) this.context.onDriversInit(this.driversDidInit.bind(this))
    if (this.servicesDidInit) this.context.onServicesInit(this.servicesDidInit.bind(this))
    if (this.appDidInit) this.context.onAppInit(this.appDidInit.bind(this))
  }
  // define this method and it will be called on system init
  init?(): Promise<void>
  // define this method to destroy entity when system is destroying.
  // Don't call this method in other cases.
  destroy?(): Promise<void>

  // it will be called after all the entities of entityType have been inited
  protected driversDidInit?(): Promise<void>
  protected servicesDidInit?(): Promise<void>
  // it will be risen after app init or immediately if app was inited
  protected appDidInit?(): Promise<void>

  // TODO: review
  /**
   * Load manifest of this entity
   */
  protected async getManifest(): Promise<ManifestType> {
    return this.context.system.envSet.loadManifest<ManifestType>(this.definition.entityType, this.className)
  }

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
