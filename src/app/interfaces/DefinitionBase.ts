export default interface DefinitionBase {
  // unique id of item in group
  id: string;
  // instance params
  props: {[index: string]: any};
}
