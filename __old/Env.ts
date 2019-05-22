import ManifestBase from '../system/interfaces/ManifestBase';
import System from '../system/System';
import HostConfig from '../system/interfaces/HostConfig';
import IoItem from '../system/interfaces/IoItem';
import LogPublisher from '../system/LogPublisher';
import DriverBase from '../system/baseDrivers/DriverBase';


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
