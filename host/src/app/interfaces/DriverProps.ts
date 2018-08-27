import DriverDefinition from './DriverDefinition';
import DriverManifest from './DriverManifest';


// prepared definition of driver of host
export default interface DriverProps extends DriverDefinition {
  manifest: DriverManifest;
}
