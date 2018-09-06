export interface EntityProps {
  // double of id of entity
  id: string;
  [index: string]: any;
}


export default interface EntityDefinition {
  // unique id of entity in group
  id: string;
  // name of class which will be used
  className: string;
  // instance params
  props: EntityProps;
}
