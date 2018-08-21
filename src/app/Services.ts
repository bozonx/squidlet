import System from './System';
import ServiceDefinition from './interfaces/ServiceDefinition';


export default class Services {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  async init(): Promise<void> {
    const servicesDefinitions: ServiceDefinition[] = this.system.host.config.services;

    servicesDefinitions.map((service: ServiceDefinition) => {

    });
  }

}
