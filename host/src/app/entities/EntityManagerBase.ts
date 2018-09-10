import System from '../System';
import EntityDefinition, {EntityProps} from '../interfaces/EntityDefinition';
import Env from '../interfaces/Env';


interface BaseEntityInstance {
  init?: () => Promise<void>;
}

export type EntityClassType = new (props: EntityProps, env: Env) => BaseEntityInstance;


export default abstract class EntityManagerBase<EntityInstance extends BaseEntityInstance> {
  protected readonly abstract env: Env;
  protected readonly system: System;
  protected readonly instances: {[index: string]: EntityInstance} = {};

  constructor(system: System) {
    this.system = system;
  }


  protected async makeInstance (definition: EntityDefinition): Promise<EntityInstance> {
    const EntityClass = await this.system.configSet.loadEntityClass<EntityClassType>(
      this.system.initCfg.hostDirs.devices,
      definition.id
    );

    return new EntityClass(definition.props, this.env) as EntityInstance;
  }

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
