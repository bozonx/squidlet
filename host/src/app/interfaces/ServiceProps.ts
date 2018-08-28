import ServiceDefinition from './ServiceDefinition';
import ServiceManifest from './ServiceManifest';


// prepared definition of driver of host
export default interface ServiceProps extends ServiceDefinition {
  manifest: ServiceManifest;
}
