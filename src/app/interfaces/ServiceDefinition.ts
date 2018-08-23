import DefinitionBase from './DefinitionBase';


// prepared definition of service of host
export default interface ServiceDefinition extends DefinitionBase {
  // // parsed and prepared manifest
  // entity: {
  //   // directory where manifest places. It is set on master configure time
  //   //baseDir: string;
  //   // unique name
  //   name: string;
  //   // path to device main file
  //   main: string;
  // };
  // service manifest name
  service: string;
  // unique id of service
  id: string;
  // any other params
  //[index: string]: any;
}
