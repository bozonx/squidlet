import ManifestBase from './ManifestBase';
import System from '../System';
import HostConfig from './HostConfig';
import IoItem from './IoItem';
import LogPublisher from '../LogPublisher';
import DriverBase from '../baseDrivers/DriverBase';


export default interface Env {
  readonly system: System;
  readonly log: LogPublisher;
  readonly config: HostConfig;

  getIo<T extends IoItem>(shortDevName: string): T;

  // TODO generic не обязателен наверное

  getDriver<T extends DriverBase>(driverName: string): T;
  // load manifest of entity type
  loadManifest(entityName: string): Promise<ManifestBase>;
  [index: string]: any;
}
