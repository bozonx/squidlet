import InitializationConfig from '../interfaces/InitializationConfig';


export default function initializationConfig(): InitializationConfig {
  return {
    fileNames: {
      hostConfig: 'config.json',
      manifest: 'manifest.json',
      // name of built main file of entity
      //mainJs: '__main.js',

      // list of system drivers like driverName[]
      systemDrivers: 'systemDrivers.json',
      // list of regular drivers like driverName[]
      regularDrivers: 'regularDrivers.json',

      // list of system services like serviceId[]
      systemServices: 'systemServices.json',
      // list of regular services like serviceId[]
      regularServices: 'regularServices.json',

      // definitions of devices like DeviceDefinition[]
      devicesDefinitions: 'devicesDefinitions.json',
      // definitions of drivers like {driverName: DriverDefinition}
      driversDefinitions: 'driversDefinitions.json',
      // definitions of services like {serviceId: ServiceDefinition}
      servicesDefinitions: 'servicesDefinitions.json',
      // params which will be sent to dev.configure()
      devsDefinitions: 'devsDefinitions.json',
    },
  };
}
