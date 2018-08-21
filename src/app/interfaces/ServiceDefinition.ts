export default interface ServiceDefinition {
  // service manifest name
  service: string;
  // unique id of service
  id: string;
  [index: string]: any;
}
