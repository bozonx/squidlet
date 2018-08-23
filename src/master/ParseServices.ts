import ServiceDefinition from '../app/interfaces/ServiceDefinition';
import System from '../app/System';
import PreServiceManifest from './interfaces/PreServiceManifest';


export default class ParseServices {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  parseManifests(): {[index: string]: PreServiceManifest} {
    // TODO: получить все зарегистрированные сервисы
  }

  generateHostDefinitions(
    hostServicesDefinitions: {[index: string]: any},
    servicesManifests: {[index: string]: PreServiceManifest}
  ): {[index: string]: ServiceDefinition} {
    const completedDefinitions: {[index: string]: ServiceDefinition} = {};

    for (let serviceId of Object.keys(hostServicesDefinitions)) {
      if (servicesManifests[serviceId]) {
        // id is service name
      }
      else {
        // used custom id
      }


    }

    return completedDefinitions;
  }

}
