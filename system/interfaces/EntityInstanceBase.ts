import EntityDefinition from './EntityDefinition';
import Env from './Env';


export type EntityClassType = new (definition: EntityDefinition, env: Env) => BaseEntityInstance;


export default interface BaseEntityInstance {
  init?: () => Promise<void>;
  destroy?: () => Promise<void>;
  [index: string]: any;
}
