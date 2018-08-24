import System from './System';


export default class MasterConfigurator {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  init(): void {

  }

  // async init222(devicesManifests: object, devicesConfig: object): Promise<void> {
  //   const recursively = async (container, containerPath) => {
  //     if (!_.isPlainObject(container)) return;
  //
  //     if (container.device) {
  //       // device has found - init it
  //       return await this._initDevice(devicesManifests, container, containerPath);
  //     }
  //
  //     // go deeper
  //     await Promise.all(_.map(container, (item, name) => {
  //       const itemPath = _.trimStart(`${containerPath}.${name}`, '.');
  //
  //       return recursively(item, itemPath);
  //     }));
  //   };
  //
  //   await recursively(devicesConfig, '');
  // }
  //
  // validateConfig() {
  //   if (!manifest.schema) {
  //     throw new Error(`Manifest of device "${rawDeviceConf.device}" doesn't have a schema`);
  //   }
  // }

  // /**
  //  * Configure master to slaves connections.
  //  */
  // private configureMasterConnections() {
  //
  //   // TODO: use host config - там плоская структура
  //
  //   // findRecursively(this.system.host.config.devices, (item, itemPath): boolean => {
  //   //   if (!_.isPlainObject(item)) return false;
  //   //   // go deeper
  //   //   if (!item.device) return undefined;
  //   //   if (item.device !== 'host') return false;
  //   //
  //   //   const connection = {
  //   //     host: itemPath,
  //   //     type: item.address.type,
  //   //     //bus: item.address.bus,
  //   //     bus: (_.isUndefined(item.address.bus)) ? undefined : String(item.address.bus),
  //   //     address: item.address.address,
  //   //   };
  //   //
  //   //   this.registerConnection(connection);
  //   //
  //   //   return false;
  //   // });
  // }

}

