import System from '../System';
import EntityDefinition, {EntityProps} from '../interfaces/EntityDefinition';
import Env from '../interfaces/Env';
import {ManifestsTypePluralName} from '../../../../configWorks/Entities';


interface BaseEntityInstance {
  init?: () => Promise<void>;
}

export type EntityClassType = new (definition: EntityDefinition, env: Env) => BaseEntityInstance;


export default abstract class EntityManagerBase<EntityInstance extends BaseEntityInstance, EntityEnv extends Env> {
  protected readonly abstract EnvClass: new (system: System) => EntityEnv;
  protected readonly system: System;
  protected readonly instances: {[index: string]: EntityInstance} = {};
  private _env?: EntityEnv;


  protected get RealEnvClass(): new (system: System) => EntityEnv {
    return this.EnvClass;
  }

  get env(): EntityEnv {
    return this._env as EntityEnv;
  }


  constructor(system: System) {
    this.system = system;
  }

  async init() {
    this._env = new this.RealEnvClass(this.system);
  }

  protected async makeInstance (definition: EntityDefinition): Promise<EntityInstance> {
    const EntityClass = await this.system.configSet.loadMain<EntityClassType>(
      this.system.initCfg.hostDirs.devices as ManifestsTypePluralName,
      definition.id
    );

    return new EntityClass(definition, this.env) as EntityInstance;
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
