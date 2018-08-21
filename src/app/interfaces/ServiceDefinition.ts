// prepared definition of service of host

export default interface ServiceDefinition {
  // parsed and prepared manifest
  manifest: {
    // directory where manifest places. It is set on master configure time
    //baseDir: string;
    // unique name
    name: string;
    // path to device main file
    main: string;
  };
  // service manifest name
  //service: string;
  // unique id of service
  id: string;
  [index: string]: any;
}
