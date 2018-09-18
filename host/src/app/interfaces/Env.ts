import DriverInstance from './DriverInstance';
import ManifestBase from './ManifestBase';


export default interface Env {
  getDev<T extends DriverInstance>(shortDevName: string): T;
  getDriver<T extends DriverInstance>(driverName: string): T;
  // load manifest of entity type
  loadManifest(entityName: string): Promise<ManifestBase>;
  [index: string]: any;
}
