import System from '../System';
import EntityDefinition from '../interfaces/EntityDefinition';
import {ManifestsTypePluralName} from '../interfaces/ManifestTypes';
import EntityBase from './EntityBase';
import EnvBase from './EnvBase';


export type EntityClassType = new (definition: EntityDefinition, env: EnvBase) => EntityBase;


export default abstract class EntityManagerBase<EntityInstance extends EntityBase, EntityEnv extends EnvBase> {
  //protected readonly abstract EnvClass: new (system: System) => EntityEnv;
  protected readonly system: System;
  protected readonly instances: {[index: string]: EntityInstance} = {};
  private readonly _env?: EntityEnv;

  get env(): EntityEnv {
    return this._env as EntityEnv;
  }


  constructor(system: System, EnvClass: new (system: System) => EntityEnv) {
    this.system = system;
    this._env = new EnvClass(this.system);
  }

  async destroy() {
    for (let name of Object.keys(this.instances)) {
      const instance: EntityInstance = this.instances[name];

      if (instance.destroy) await instance.destroy();
    }
  }


  protected async makeInstance(pluralName: ManifestsTypePluralName, definition: EntityDefinition): Promise<EntityInstance> {
    const EntityClass = await this.system.envSet.loadMain<EntityClassType>(
      pluralName,
      definition.className
    );

    return new EntityClass(definition, this.env) as EntityInstance;
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

    // // Rise did init after enities base initialization
    // for (let entityId of entitiesIds) {
    //   const entity: EntityInstance = this.instances[entityId];
    //
    //   if (entity.$riseDidInit) await entity.$riseDidInit();
    // }
  }

}
