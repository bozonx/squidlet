import PreServiceManifest from './interfaces/PreServiceManifest';
import ServiceDefinition from '../app/interfaces/ServiceDefinition';


export default class HostConfigGenerator {
  constructor() {

  }

  // TODO: !!!! add devs specified to platform

  generate() {

  }

  private generateServices(
    servicesManifests: {[index: string]: PreServiceManifest}
  ): {[index: string]: ServiceDefinition} {
    // TODO: слить props
    // TODO: сформировать service definition - вставить из манифеста что нужно

  }

}
