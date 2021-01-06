import EntityDefinition from '../interfaces/EntityDefinition';
import {EntityType} from '../interfaces/EntityTypes';
import EntityBase from '../../../src/base/EntityBase';
import Context from '../../../src/system/Context';


export type EntityClassType = new (context: Context, definition: EntityDefinition) => EntityBase;


export default abstract class EntityManagerBase<EntityInstance extends EntityBase> {
  protected readonly abstract entityType: EntityType;

  protected readonly context: Context;
  protected readonly instances: {[index: string]: EntityInstance} = {};


  constructor(context: Context) {
    this.context = context;
  }

  async destroy() {
    for (let name of Object.keys(this.instances)) {
      const instance: EntityInstance = this.instances[name];

      if (instance.destroy) await instance.destroy();
    }
  }


  /**
   * Call init function of all the instances.
   */
  async initialize() {
    for (let entityId of Object.keys(this.instances)) {
      const entity: EntityInstance = this.instances[entityId];

      this.context.log.debug(`EntityManager: initializing ${this.entityType} "${entityId}"`);

      if (entity.init) await entity.init();
    }
  }

  getIds(): string[] {
    return Object.keys(this.instances);
  }


  protected async makeInstance(definition: EntityDefinition): Promise<EntityInstance> {
    const EntityClass = await this.context.system.envSet.loadMain<EntityClassType>(
      this.entityType,
      definition.className
    );

    return new EntityClass(this.context, definition) as EntityInstance;
  }

}
