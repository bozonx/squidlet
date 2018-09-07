import System from '../System';
import EntityDefinition, {EntityProps} from '../interfaces/EntityDefinition';
import Env from './Env';


interface BaseEntityInstance {
  init: () => Promise<void>;
}

type EntityClassType = new (props: EntityProps, env: Env) => BaseEntityInstance;


export default abstract class EntityManagerBase<EntityInstance extends BaseEntityInstance> {
  protected readonly system: System;
  protected readonly instances: {[index: string]: EntityInstance} = {};

  constructor(system: System) {
    this.system = system;
  }


  protected async makeInstance (definition: EntityDefinition): Promise<EntityInstance> {
    const EntityClass = await this.system.host.loadEntityClass<EntityClassType>(
      this.system.initCfg.hostDirs.devices,
      definition.id
    );

    return new EntityClass(definition.props, this.system.env) as EntityInstance;
  }

  protected async initializeAll() {
    for (let entityId of Object.keys(this.instances)) {
      const entity: EntityInstance = this.instances[entityId];

      await entity.init();
    }
  }

}
