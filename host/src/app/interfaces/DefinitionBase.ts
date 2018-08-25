export default interface DefinitionBase {
  // unique id of item in group
  id: string;
  // name of class which will be used
  className: string;
  // instance params
  props: {[index: string]: any};
}
