// parsed manifest of device
import EntityManifest from '../../../__idea2021/src/interfaces/EntityManifest';


export default interface DeviceManifest extends EntityManifest {
  // generic type of device
  type: string;
  // schema of statuses of device
  status?: {[index: string]: any};
  // schema of config of device
  config?: {[index: string]: any};
}
