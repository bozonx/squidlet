import DriverInstance from './DriverInstance';
import ManifestBase from './ManifestBase';
import System from '../System';
import Logger from './Logger';
import HostConfig from './HostConfig';
import IoItem from './IoItem';


export default interface Env {
  readonly system: System;
  readonly log: Logger;
  readonly config: HostConfig;

  getIo<T extends IoItem>(shortDevName: string): T;

  // TODO generic не обязателен наверное

  getDriver<T extends DriverInstance>(driverName: string): T;
  // load manifest of entity type
  loadManifest(entityName: string): Promise<ManifestBase>;
  [index: string]: any;
}
