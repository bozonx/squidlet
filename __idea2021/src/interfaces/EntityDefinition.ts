import {EntityType} from './EntityTypes'


export default interface EntityDefinition {
  entityType: EntityType
  // unique id of entity in the host
  id: string
  // name of class which will be used
  className: string
  // instance props
  props: Record<string, any>
}
