import EntityDefinition from '../interfaces/EntityDefinition';
import {ManifestsTypePluralName} from '../interfaces/ManifestTypes';
import EntityBase from '../entities/EntityBase';
import Context from '../Context';


export type EntityClassType = new (context: Context, definition: EntityDefinition) => EntityBase;


export default class EntityManagerBase<EntityInstance extends EntityBase> {
  protected readonly context: Context;
  protected readonly instances: {[index: string]: EntityInstance} = {};


  constructor(context: Context) {
    this.context = context;
  }

  async destroy() {
    for (let name of Object.keys(this.instances)) {
      const instance: EntityInstance = this.instances[name];

      if (instance.doDestroy) await instance.doDestroy();
    }
  }


  protected async makeInstance(pluralName: ManifestsTypePluralName, definition: EntityDefinition): Promise<EntityInstance> {
    const EntityClass = await this.context.system.envSet.loadMain<EntityClassType>(
      pluralName,
      definition.className
    );

    return new EntityClass(this.context, definition) as EntityInstance;
  }

  /**
   * Call init function of all the instances.
   */
  protected async initializeAll(entitiesIds: string[]) {
    for (let entityId of entitiesIds) {
      if (typeof this.instances[entityId] === 'undefined') {
        throw new Error(`Can't find an entity to init`);
      }

      const entity: EntityInstance = this.instances[entityId];

      if (entity.init) await entity.init();
    }
  }

}
