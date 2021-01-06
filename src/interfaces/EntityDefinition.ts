import {EntityType} from './EntityTypes'

export interface EntitiesDefinitions {
  devices: {[index: string]: EntityDefinition};
  drivers: {[index: string]: EntityDefinition};
  services: {[index: string]: EntityDefinition};
}


export default interface EntityDefinition {
  entityType: EntityType
  // unique id of entity in group
  id: string
  // name of class which will be used
  className: string
  // instance params
  props: {[index: string]: any}
}
