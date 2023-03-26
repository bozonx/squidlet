import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js'


export default interface EntityDefinition {
  entityType: EntityType
  // unique id of entity in the host
  id: string
  // name of class which will be used
  className: string
  // instance props
  props: Record<string, any>
}
